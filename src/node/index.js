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

// 顧客情報取得
app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.json({ success: true, data: customerData.rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching customer data" });
  }
});

// 特定の顧客情報取得
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

// 顧客追加
app.post("/add-customer", async (req, res) => {
  try {
    const { company_name, industry, contact, location } = req.body;
    console.log("Request received:", req.body);
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

// 顧客削除
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

// 顧客情報更新
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

// 案件情報取得
app.get("/cases", async (req, res) => {
  try {
    const caseData = await pool.query("SELECT * FROM cases");
    res.json({ success: true, data: caseData.rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching case data" });
  }
});

// 特定の案件情報取得
app.get("/cases/:caseId", async (req, res) => {
  try {
    const caseId = req.params.caseId;
    const caseData = await pool.query("SELECT * FROM cases WHERE case_id = $1", [caseId]);

    if (caseData.rows.length > 0) {
      res.json({ success: true, data: caseData.rows[0] });
    } else {
      res.json({ success: false, message: "Case not found" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching case data" });
  }
});

// 案件追加
app.post("/add-case", async (req, res) => {
  try {
    const { case_name, case_status, expected_revenue, representative, customer_id } = req.body;
    console.log("Case request received:", req.body);
    const newCase = await pool.query(
      "INSERT INTO cases (case_name, case_status, expected_revenue, representative, customer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [case_name, case_status, expected_revenue, representative, customer_id]
    );
    res.json({ success: true, data: newCase.rows[0] });
  } catch (error) {
    console.error("Error adding case:", error);
    res.json({ success: false, error: "Failed to add case" });
  }
});

// 案件削除
app.delete("/delete-case/:caseId", async (req, res) => {
  try {
    const caseId = req.params.caseId;
    const deleteCase = await pool.query("DELETE FROM cases WHERE case_id = $1 RETURNING *", [caseId]);

    if (deleteCase.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Case not found" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error deleting case" });
  }
});

// 案件情報更新
app.put("/update-case/:caseId", async (req, res) => {
  const caseId = req.params.caseId;
  const updateData = req.body;

  try {
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);

    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");

    const updatedCase = await pool.query(
      `UPDATE cases SET ${setClause} WHERE case_id = $${keys.length + 1} RETURNING *`,
      [...values, caseId]
    );

    res.json({ success: true, data: updatedCase.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error updating case" });
  }
});

// サーバー公開用の静的ファイル設定
app.use('/customer', express.static('web/customer'));
app.use('/case', express.static('web/case'));

app.use(express.static("public"));
