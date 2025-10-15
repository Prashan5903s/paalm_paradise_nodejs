const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
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

        // ==== PATH SETUP ====
        const baseDir = path.resolve(__dirname, "../../");
        const invoicesDir = path.join(baseDir, "public/invoices");
        if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, {
            recursive: true
        });

        const filePath = path.join(invoicesDir, `invoice_${invoiceNo}.pdf`);
        const doc = new PDFDocument({
            margin: 50,
            size: "A4"
        });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ==== LOGO ====
        const response = await axios.get("https://society.learningink.com/images/company_logo.png", {
            responseType: "arraybuffer"
        });
        const logoBuffer = Buffer.from(response.data, "binary");

        doc.image(logoBuffer, 60, 40, {
            width: 120
        });

        doc.fontSize(10).fillColor("#333")
            .text("Zoo Deoria By Pass,", 60, 95)
            .text("Paalm Paradise, near Gorakhpur,", 60)
            .text("Uttar Pradesh 273016", 60);

        // ==== INVOICE INFO BOX ====
        const boxX = 330;
        const boxY = 40;
        doc.roundedRect(boxX, boxY, 220, 90, 6).fill("#f5f5f5").stroke();
        doc.fillColor("#000")
            .fontSize(12)
            .text(`Invoice #${bill.invoice_no}`, boxX + 10, boxY + 10)
            .fontSize(10)
            .text(`Date Issued: ${new Date(bill.bill_date).toLocaleDateString("en-GB")}`, boxX + 10, boxY + 35)
            .text(`Date Due: ${new Date(bill.bill_due_date).toLocaleDateString("en-GB")}`, boxX + 10, boxY + 55);

        // ==== TITLE ====
        doc.fontSize(18).fillColor("#000").text("Invoice", 0, 150, {
            align: "center"
        });

        // ==== BILL INFO ====
        const user = bill.apartment_id?.assigned_to || {};
        const leftX = 60;
        const rightX = 330;
        const topY = 190;

        doc.fontSize(12).fillColor("#000").text("Bill From:", leftX, topY);
        doc.fontSize(12).text("Bill To:", rightX, topY);

        // Bill From
        doc.fontSize(10).fillColor("#444")
            .text("Paalm Paradise", leftX, topY + 20, {
                width: 200
            })
            .text("Talramgarh, Deoria Bypass Road", leftX, topY + 35, {
                width: 200
            })
            .text("Gorakhpur, Uttar Pradesh 273016", leftX, topY + 50, {
                width: 200
            })
            .text("+91 9513369620", leftX, topY + 65);

        // Bill To
        doc.text(`${user.first_name || ""} ${user.last_name || ""}`, rightX, topY + 20, {
                width: 200
            })
            .text(user.email || "", rightX, topY + 35, {
                width: 200
            })
            .text(user.phone || "", rightX, topY + 50, {
                width: 200
            })
            .text(`${user.address || `F-${bill.apartment_id?.apartment_no || ""}, Paalm Paradise`} ${user.pincode || "273016"}`,
                rightX, topY + 65, {
                    width: 200
                });

        // ==== TABLE ====
        const startY = 300;
        const tableWidth = 480;

        // We removed Qty column (only S.No, Description, Amount)
        const colWidths = [50, 330, 100];
        const cols = [
            leftX,
            leftX + colWidths[0],
            leftX + colWidths[0] + colWidths[1]
        ];

        // Table Header
        doc.rect(leftX, startY, tableWidth, 25).fill("#f4f4f4").stroke();
        doc.fillColor("#000").fontSize(10).font("Helvetica-Bold")
            .text("S.No", cols[0] + 10, startY + 7)
            .text("Description", cols[1] + 10, startY + 7)
            .text("Amount", cols[2] + 10, startY + 7, {
                align: "right"
            });

        // Table Rows
        let y = startY + 30;
        let total = 0;
        const formatINR = (n) => n.toLocaleString("en-IN");

        bill.payments.forEach((p, i) => {
            total += p.amount;
            doc.fillColor("#000").fontSize(10).font("Helvetica");
            doc.text(i + 1, cols[0] + 10, y)
                .text(p.description || bill.bill_type?.name || "Utility Bill", cols[1] + 10, y)
                .text(`₹${formatINR(p.amount)}`, cols[2] + 10, y, {
                    align: "right"
                });
            y += 25;
        });

        // Total Line
        doc.moveTo(leftX, y).lineTo(leftX + tableWidth, y).stroke();
        doc.fontSize(11).font("Helvetica-Bold")
            .text("Total:", cols[1] + 10, y + 10)
            .text(`₹${formatINR(total)}`, cols[2] + 10, y + 10, {
                align: "right"
            });

        // Amount in Words
        const words = toWords(total).replace(/\b\w/g, (c) => c.toUpperCase());
        doc.font("Helvetica").fontSize(10).fillColor("#333")
            .text(`Total Amount In Words: INR ${words} Rupees Only`, leftX, y + 50, {
                width: tableWidth
            });

        // ==== FOOTER ====
        doc.fontSize(9).fillColor("#777")
            .text("Thank you for your payment!", 0, doc.page.height - 60, {
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