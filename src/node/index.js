const express = require("express");
const app = express();
const port = 13519;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_ayumi_otake",
  host: "localhost",
  database: "db_ayumi_otake",
  password: "pass",
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.json({ success: true, data: customerData.rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching customer data" });
  }
});

app.get("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const customerData = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [customerId]);

    if (customerData.rows.length > 0) {
      res.json({ success: true, customer: customerData.rows[0] });
    } else {
      res.json({ success: false, message: "Customer not found" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching customer data" });
  }
});

app.post("/add-customer", async (req, res) => {
  try {
    const { company_name, industry, contact, location } = req.body;
    console.log("リクエストを受け取りました:", req.body);
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [company_name, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error adding customer" });
  }
});

app.delete("/delete-customer/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const deleteCustomer = await pool.query("DELETE FROM customers WHERE customer_id = $1 RETURNING *", [customerId]);

    if (deleteCustomer.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Customer not found" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error deleting customer" });
  }
});

app.put("/update-customer/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const updateData = req.body;

  try {
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");

    const updatedCustomer = await pool.query(
      `UPDATE customers SET ${setClause} WHERE customer_id = $${keys.length + 1} RETURNING *`,
      [...values, customerId]
    );

    res.json({ success: true, customer: updatedCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error updating customer" });
  }
});

app.post("/add-confirm-case", async (req, res) => {
  try {
    const { case_name, case_status, expected_revenue, representative, customer_id } = req.body;
    console.log("Confirm Case request received:", req.body);

    // セッションストレージからフォームデータを取得
    const storedFormData = sessionStorage.getItem('formData');
    const formData = storedFormData ? JSON.parse(storedFormData) : {};

    // サーバーサイドからのフォームデータをマージ
    const mergedData = {
      case_name: formData.case_name || case_name,
      case_status: formData.case_status || case_status,
      expected_revenue: formData.expected_revenue || expected_revenue,
      representative: formData.representative || representative,
      customer_id: formData.customer_id || customer_id
    };

    const newCase = await pool.query(
      "INSERT INTO cases (case_name, case_status, expected_revenue, representative, customer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [mergedData.case_name, mergedData.case_status, mergedData.expected_revenue, mergedData.representative, mergedData.customer_id]
    );

    // フォームデータを削除
    sessionStorage.removeItem('formData');

    res.json({ success: true, case: newCase.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error confirming and adding case" });
  }
});

// ... (その他のエンドポイントや静的ファイルの設定)

app.use('/customer', express.static('web/customer'));
app.use('/case', express.static('web/case'));

app.use(express.static("public"));
