# Google Sheets Login Setup Guide (`academy.html`)

Follow these 4 steps to connect `academy.html` to your own Google Sheet for user login, access approval, and progress sync:

1. **Create a Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet (e.g. `Academy Auth & Progress`).

2. **Add the Apps Script**
   - In the spreadsheet menu, click **Extensions → Apps Script**.
   - Delete any starter code and paste the entire contents of `Code.gs` from this folder.
   - Click **Save** (`Ctrl+S` / `Cmd+S`).

3. **Deploy as a Web App**
   - Click **Deploy → New deployment**.
   - Click the gear icon → select **Web app**.
   - Set **Execute as**: `Me`
   - Set **Who has access**: `Anyone`
   - Click **Deploy** and authorize permissions when prompted.
   - Copy the **Web app URL** (`https://script.google.com/macros/s/.../exec`).

4. **Connect to `academy.html`**
   - Open `academy.html`, click **⚙️ Sheet Config** (or paste it into `DEFAULT_AUTH_SHEET_URL` inside `academy.html` so it works automatically for all visitors).
   - Default seeded owner login:
     - **Email**: `owner@wasteofbyte.dev`
     - **Password**: `100rav`
   - When someone registers via **Request Access**, a new row appears in the `Users` tab with `status = PENDING`. Change `PENDING` to `ACTIVE` in Google Sheets to grant them access (and optionally set `allowed_tracks` to `ALL` or e.g. `snowflake,labs`).
