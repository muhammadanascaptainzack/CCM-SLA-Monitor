"""
Locust ISP Subscriber Simulation Suite
Target: Citrus ISP Customer Complaint Management Portal

Run Command (from separate load testing machine):
  locust -f tests/locustfile.py --host=http://<SERVER_IP>:4000 --users 1000 --spawn-rate 50
"""

import time
import random
from locust import HttpUser, task, between

SAMPLE_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
CUSTOMERS = ["usr-1", "usr-2", "usr-3"]


class ISPCustomerUser(HttpUser):
    wait_time = between(2.5, 6.0)

    def on_start(self):
        self.customer_id = random.choice(CUSTOMERS)
        self.client.get("/api/config", name="1_Open_Portal_Config")

    @task(4)
    def check_profile_and_zalpro_status(self):
        self.client.get(
            f"/api/radius/subscriber/{self.customer_id}",
            name="2_ZalPro_Profile_Connection_Balance",
        )

    @task(4)
    def check_complaint_history(self):
        self.client.get(
            f"/api/complaints?customerId={self.customer_id}",
            name="3_Check_Complaint_History",
        )

    @task(1)
    def submit_complaint_and_screenshot(self):
        idem_key = f"locust-{self.customer_id}-{int(time.time() * 1000)}-{random.randint(1000,9999)}"
        self.client.post(
            "/api/complaints",
            json={
                "customerId": self.customer_id,
                "category": "FREQUENT_DISCONNECT",
                "priority": "P2_MAJOR",
                "subject": "Frequent fiber link drop on Huawei ONT",
                "description": "PON LED blinking green and internet dropping during peak evening hours.",
                "idempotencyKey": idem_key,
            },
            headers={"X-Idempotency-Key": idem_key},
            name="4_Submit_Complaint",
        )
        self.client.post(
            "/api/uploads/evidence",
            json={
                "filename": "ont-screenshot.png",
                "mimeType": "image/png",
                "base64Data": SAMPLE_PNG_B64,
            },
            name="5_Upload_Evidence_Screenshot",
        )
