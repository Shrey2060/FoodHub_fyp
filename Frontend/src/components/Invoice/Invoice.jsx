import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Invoice.css";

const Invoice = () => {
  const location = useLocation();
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const purchaseOrderId = queryParams.get("purchase_order_id");
    const amount = queryParams.get("amount");
    const name = queryParams.get("name");
    const email = queryParams.get("email");
    const phone = queryParams.get("phone");

    if (purchaseOrderId && amount) {
      setInvoiceData({ purchaseOrderId, amount, name, email, phone });
    }
  }, [location]);

  return (
    <div className="invoice-container">
      <h2>Invoice</h2>
      {invoiceData ? (
        <div className="invoice-details">
          <p><strong>Order ID:</strong> {invoiceData.purchaseOrderId}</p>
          <p><strong>Name:</strong> {invoiceData.name}</p>
          <p><strong>Email:</strong> {invoiceData.email}</p>
          <p><strong>Phone:</strong> {invoiceData.phone}</p>
          <p><strong>Amount Paid:</strong> NPR {invoiceData.amount / 100}</p>
        </div>
      ) : (
        <p>Loading invoice details...</p>
      )}
    </div>
  );
};

export default Invoice;
