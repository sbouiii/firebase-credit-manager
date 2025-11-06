import { Store } from "@shared/schema";
import { Payment, Credit } from "@shared/schema";
import { format } from "date-fns";
import { Printer, X, Calendar, User, FileText, DollarSign, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRef } from "react";

interface PaymentReceiptProps {
  store: Store | undefined;
  payment: Payment;
  credit: Credit;
  customerName: string;
  onClose: () => void;
}

export function PaymentReceipt({ store, payment, credit, customerName, onClose }: PaymentReceiptProps) {
  const { t } = useLanguage();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = receiptRef.current.innerHTML;
    const styles = Array.from(document.head.querySelectorAll("style")).map(
      (style) => style.outerHTML
    ).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t("credits.receipt")} - ${payment.id}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .receipt-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border: 1px solid #e5e7eb;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .receipt-logo {
              max-width: 80px;
              max-height: 80px;
              margin: 0 auto 10px;
            }
            .receipt-title {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .receipt-section {
              margin: 20px 0;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px dotted #ccc;
            }
            .receipt-label {
              font-weight: 500;
              color: #666;
            }
            .receipt-value {
              font-weight: 600;
              text-align: right;
            }
            .receipt-divider {
              border-top: 2px solid #000;
              margin: 20px 0;
              padding-top: 10px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #666;
              font-size: 12px;
            }
          </style>
          ${styles}
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t("credits.receipt")}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="no-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            {t("credits.printReceipt")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="no-print"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={receiptRef} className="receipt-container bg-white p-0 rounded-xl shadow-2xl overflow-hidden" style={{ maxWidth: "420px", margin: "0 auto" }}>
        {/* Header with gradient */}
        <div className="receipt-header text-center p-6 pb-8" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
          {store?.logo && (
            <img
              src={store.logo}
              alt={store.name || "Store"}
              className="receipt-logo mx-auto mb-4 max-w-24 max-h-24 object-contain rounded-full bg-white p-2 shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="receipt-title text-3xl font-bold mt-2 mb-2" style={{ color: "#fff" }}>
            {store?.name || "Store"}
          </div>
          <div className="text-sm font-medium opacity-90" style={{ color: "#fff" }}>
            {t("credits.paymentReceipt")}
          </div>
        </div>

        {/* Receipt Number Badge */}
        <div className="px-6 -mt-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "#667eea" }} />
              <span className="text-xs font-medium" style={{ color: "#666" }}>{t("credits.receiptNumber")}</span>
            </div>
            <span className="font-mono font-bold text-sm" style={{ color: "#667eea" }}>#{payment.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* Payment Information Cards */}
        <div className="px-6 space-y-4 mb-6">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" style={{ color: "#667eea" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#667eea" }}>
                {t("credits.transactionInfo")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium" style={{ color: "#666" }}>{t("credits.date")}:</span>
              <span className="text-sm font-semibold" style={{ color: "#000" }}>{format(payment.createdAt, "dd/MM/yyyy HH:mm")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-200">
              <span className="text-sm font-medium" style={{ color: "#666" }}>{t("credits.customer")}:</span>
              <span className="text-sm font-semibold" style={{ color: "#000" }}>{customerName}</span>
            </div>
          </div>

          {/* Credit Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4" style={{ color: "#667eea" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#667eea" }}>
                {t("credits.creditDetails")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium" style={{ color: "#666" }}>{t("credits.amount")}:</span>
              <span className="text-sm font-bold" style={{ color: "#dc2626" }}>{credit.remainingAmount.toLocaleString()} DT</span>
            </div>
          </div>

          {/* Payment Amount - Highlighted */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#059669" }}>
                  {t("credits.paymentAmount")}
                </div>
                <div className="text-3xl font-bold" style={{ color: "#059669" }}>
                  {payment.amount.toLocaleString()} DT
                </div>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingDown className="h-6 w-6" style={{ color: "#059669" }} />
              </div>
            </div>
          </div>

          {/* Note */}
          {payment.note && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5" style={{ color: "#3b82f6" }} />
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1" style={{ color: "#3b82f6" }}>{t("credits.note")}:</div>
                  <div className="text-sm" style={{ color: "#000" }}>{payment.note}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-6 text-center border-t-2 border-gray-200">
          <div className="mb-3">
            <div className="text-base font-semibold mb-1" style={{ color: "#000" }}>{t("credits.thankYou")}</div>
            <div className="text-xs" style={{ color: "#666" }}>{t("credits.receiptFooter")}</div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px flex-1 bg-gray-300"></div>
            <div className="text-xs font-medium" style={{ color: "#999" }}>✓ {t("credits.verified")}</div>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

