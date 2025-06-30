import jsPDF from "jspdf";
import "jspdf-autotable";

const PdfReport = ({ transactions, userEmail }) => {
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Expense & Budget Tracker Report", 14, 22);

    doc.setFontSize(12);
    doc.text(`User: ${userEmail}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);

    const tableColumn = ["Date", "Type", "Category", "Amount", "Note"];
    const tableRows = [];

    transactions.forEach(txn => {
      const txnData = [
        txn.date.substring(0, 10),
        txn.type,
        txn.category,
        `₹${txn.amount}`,
        txn.note || "-"
      ];
      tableRows.push(txnData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
    });

    doc.save("expense_report.pdf");
  };

  return (
    <button onClick={generatePDF} style={{ marginBottom: "20px" }}>
      Download PDF Report
    </button>
  );
};

export default PdfReport;
