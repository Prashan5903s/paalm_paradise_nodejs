const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const UserBill = require("../../model/UserBill");
const Bill = require("../../model/Bill");
const User = require("../../model/User");
const Maintenance = require("../../model/Maintenance");
const {
    successResponse,
    errorResponse
} = require("../../util/response");

exports.getBillController = async (req, res, next) => {
    try {
        const statusField = req.params.status || false;
        let data = [];

        const userId = req.userId;
        const type = req.params.type;

        const user = await User.findById(userId);
        const masterId = user?.created_by;

        if (type === "common-area-bill") {
            const bills = await Bill.find({
                    status: statusField,
                    bill_data_type: type,
                    created_by: masterId,
                })
                .populate("apartment_id")
                .populate("bill_type")
                .populate({
                    path: "payments",
                    model: "Payment",
                });

            data = bills;
        } else if (type === "maintenance") {
            let datas = {};

            const bills = await Bill.find({
                bill_data_type: type,
                created_by: masterId,
            }).select("_id");

            const billsId = bills.map((b) => b._id.toString());

            const userBill = await UserBill.find({
                    user_id: userId,
                    bill_id: {
                        $in: billsId
                    },
                })
                .populate("bill_id")
                .populate("apartment_id")
                .populate("user_id")
                .populate("payments");

            const maintenance = await Maintenance.findOne({
                cost_type: "1",
                created_by: masterId,
            });

            const fixedCost = maintenance?.fixed_data || [];

            if (!userBill) {
                return errorResponse(res, "User bill does not exist", {}, 404);
            }

            datas["userBill"] = userBill;
            datas["fixed_cost"] = fixedCost;

            data = datas;
        } else {
            data = await Bill.find({
                    created_by: masterId,
                    status: statusField,
                    bill_data_type: type,
                })
                .populate("apartment_id")
                .populate("bill_type")
                .populate({
                    path: "payments",
                    model: "Payment",
                });
        }

        return successResponse(res, "Bill fetched successfully", data);
    } catch (error) {
        next(error);
    }
};

// ========== PDF DOWNLOAD CONTROLLER ==========

exports.downloadInvoicePDF = async (req, res, next) => {
    try {
        
        const invoiceNo = req.params?.invoiceNo;

        if (!invoiceNo) {
            return errorResponse(res, "Invoice number is required", {}, 400);
        }

        const bill = await Bill.findOne({
                invoice_no: invoiceNo
            })
            .populate({
                path: "apartment_id",
                select: "apartment_no apartment_area assigned_to",
                populate: {
                    path: "assigned_to"
                },
            })
            .populate("bill_type")
            .populate("payments");

        if (!bill) {
            return errorResponse(res, "Bill does not exist", {}, 404);
        }

        // ==== DIRECTORY SETUP ====
        const baseDir = path.resolve(__dirname, "../../");
        const invoicesDir = path.join(baseDir, "public/invoices");
        if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, {
            recursive: true
        });

        const filePath = path.join(invoicesDir, `invoice_${invoiceNo}.pdf`);
        const doc = new PDFDocument({
            margin: 40
        });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ==== HEADER ====
        const logoPath = path.join(baseDir, "public/images/logo.png");
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 30, {
                width: 80
            });
        }

        doc.fontSize(18).text(`Invoice #${bill.invoice_no}`, 0, 50, {
            align: "right"
        });
        doc.moveDown(0.5);
        doc
            .fontSize(12)
            .text(`Date Issued: ${new Date(bill.bill_date).toLocaleDateString("en-GB")}`, {
                align: "right"
            })
            .text(`Due Date: ${new Date(bill.bill_due_date).toLocaleDateString("en-GB")}`, {
                align: "right"
            });
        doc.moveDown(2);

        // ==== COMPANY INFO ====
        doc.fontSize(14).text("Paalm Paradise", {
            underline: true
        });
        doc
            .fontSize(12)
            .text("Talramgarh, Deoria Bypass Road, Gorakhpur, UP 273016")
            .text("+91 9513369620");
        doc.moveDown(2);

        // ==== BILL TO ====
        const user = bill.apartment_id?.assigned_to || {};
        doc.fontSize(14).text("Bill To:", {
            underline: true
        });
        doc
            .fontSize(12)
            .text(`${user.first_name || ""} ${user.last_name || ""}`)
            .text(user.email || "")
            .text(user.phone || "")
            .text(`${user.address || ""} ${user.pincode || ""}`);
        doc.moveDown(2);

        // ==== INVOICE DETAILS ====
        doc.fontSize(14).text("Invoice Details", {
            underline: true
        });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const startX = 60;
        doc
            .fontSize(12)
            .text("S.No", startX, tableTop, {
                continued: true
            })
            .text("Description", 150, tableTop, {
                continued: true
            })
            .text("Quantity", 350, tableTop, {
                continued: true
            })
            .text("Amount (₹)", 450);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        // ==== PAYMENTS ====
        let total = 0;
        const formatINR = (num) => num.toLocaleString("en-IN");

        bill.payments.forEach((p, i) => {
            total += p.amount;
            doc
                .fontSize(12)
                .text(`${i + 1}`, startX, doc.y, {
                    continued: true
                })
                .text(p.description || "Maintenance Charge", 150, doc.y, {
                    continued: true
                })
                .text("1", 350, doc.y, {
                    continued: true
                })
                .text(`₹${formatINR(p.amount)}`, 450);
        });

        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        // ==== TOTAL ====
        doc.fontSize(12).text(`Total Amount: ₹${formatINR(total)}`, 400, doc.y + 10);
        doc.moveDown(1.5);

        // ==== AMOUNT IN WORDS ====
        const {
            toWords
        } = await import("number-to-words");
        const amountInWords = toWords(total)
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim();
        doc.text(`Total Amount In Words: ${amountInWords} Rupees Only`);
        doc.moveDown(2);

        // ==== FOOTER ====
        doc
            .fontSize(10)
            .text("Thank you for your payment!", 0, doc.y + 40, {
                align: "center"
            });

        doc.end();

        // ==== SEND PDF ====
        stream.on("finish", () => {
            res.download(filePath, `Invoice_${invoiceNo}.pdf`, (err) => {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
                });
                if (err) {
                    console.error("File download error:", err);
                    next(err);
                }
            });
        });
    } catch (error) {
        console.error("Error generating invoice:", error);
        next(error);
    }
};