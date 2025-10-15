const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const {
    toWords
} = require("number-to-words");

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
        if (!invoiceNo)
            return errorResponse(res, "Invoice number is required", {}, 400);

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

        if (!bill) return errorResponse(res, "Bill does not exist", {}, 404);

        // ==== DIRECTORY SETUP ====
        const baseDir = path.resolve(__dirname, "../../");
        const invoicesDir = path.join(baseDir, "public/invoices");
        if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, {
            recursive: true
        });

        const filePath = path.join(invoicesDir, `invoice_${invoiceNo}.pdf`);
        const doc = new PDFDocument({
            margin: 50
        });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ==== HEADER ====
        const logoPath = path.join(baseDir, "public/images/logo.png");
        const headerY = 50;

        // Logo + address box
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 60, headerY, {
                width: 100
            });
        }
        doc.fontSize(11)
            .fillColor("#333")
            .text("Zoo Deoria By Pass,", 60, headerY + 70)
            .text("Paalm Paradise, near Gorakhpur,", 60)
            .text("Uttar Pradesh 273016");

        // Invoice info box (light gray)
        doc.rect(320, 40, 220, 90).fill("#f4f4f4").stroke();
        doc.fillColor("#000").fontSize(14).text(`Invoice #${bill.invoice_no}`, 340, 55);
        doc.fontSize(11)
            .text(`Date Issued: ${new Date(bill.bill_date).toLocaleDateString("en-GB")}`, 340, 80)
            .text(`Date Due: ${new Date(bill.bill_due_date).toLocaleDateString("en-GB")}`, 340, 100);

        // ==== TITLE ====
        doc.fontSize(18).fillColor("#000").text("Invoice", {
            align: "center"
        });
        doc.moveDown(1.5);

        // ==== BILL FROM & BILL TO ====
        const user = bill.apartment_id?.assigned_to || {};

        doc.fontSize(13).text("Bill From:", 60, 160);
        doc.fontSize(13).text("Bill To:", 320, 160);

        doc.fontSize(11)
            .fillColor("#444")
            .text("Paalm Paradise", 60, 180)
            .text("Talramgarh, Deoria Bypass Road", 60)
            .text("Gorakhpur, Uttar Pradesh 273016", 60)
            .text("+91 9513369620", 60);

        doc.text(`${user.first_name || ""} ${user.last_name || ""}`, 320, 180)
            .text(user.email || "", 320)
            .text(user.phone || "", 320)
            .text(
                `${user.address || `F-${bill.apartment_id?.apartment_no || ""}, Paalm Paradise`} ${user.pincode || "273016"}`,
                320
            );

        doc.moveDown(3);

        // ==== TABLE HEADER ====
        const tableTop = doc.y + 10;
        doc.rect(60, tableTop, 480, 25).fill("#f4f4f4").stroke();
        doc.fillColor("#000").fontSize(11);
        doc.text("SNO", 75, tableTop + 7);
        doc.text("QUANTITY", 160, tableTop + 7);
        doc.text("PRODUCT", 300, tableTop + 7);
        doc.text("AMOUNT", 460, tableTop + 7, {
            align: "right"
        });

        // ==== TABLE CONTENT ====
        let y = tableTop + 30;
        let total = 0;
        const formatINR = (num) => num.toLocaleString("en-IN");

        bill.payments.forEach((p, i) => {
            total += p.amount;
            doc.fontSize(11).fillColor("#000");
            doc.text(`${i + 1}`, 75, y);
            doc.text("1", 175, y);
            doc.text(p.description || bill.bill_type?.name || "Utility Bill", 300, y);
            doc.text(`₹${formatINR(p.amount)}`, 460, y, {
                align: "right"
            });
            y += 25;
        });

        // ==== TOTAL ====
        doc.moveTo(60, y + 5).lineTo(540, y + 5).stroke();
        doc.fontSize(12)
            .text("Total:", 400, y + 15)
            .text(`₹${formatINR(total)}`, 460, y + 15, {
                align: "right"
            });

        // ==== AMOUNT IN WORDS ====
        const amountInWords = toWords(total)
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim();
        doc.moveDown(2);
        doc.fontSize(11).fillColor("#333")
            .text(`Total Amount In Words: INR ${amountInWords} Rupees Only`, 60);

        // ==== FOOTER ====
        doc.moveDown(4);
        doc.fontSize(10)
            .fillColor("#555")
            .text("Thank you for your payment!", 0, doc.y, {
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