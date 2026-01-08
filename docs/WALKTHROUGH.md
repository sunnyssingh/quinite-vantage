# Quinite Vantage - Complete Application Walkthrough

## 🌟 Overview

Quinite Vantage is a comprehensive Business Operating System tailored for the Real Estate sector. It integrates CRM, Project Management, and Advanced AI Telephony into a single, unified platform.

---

## 🚀 Feature Walkthrough

### 1. Organization Onboarding (`/onboarding`)

New organizations undergo a structured 5-step setup process:

1. **Sector:** Currently exclusive to **Real Estate** (other sectors coming soon).
2. **Business Type:** Select between **Agent/Broker** or **Developer/Builder**.
3. **Company Details:** Enter official name, GSTIN (optional), and contact info.
4. **Address:** Detailed location data for invoicing and compliance.
5. **Review:** Verify all data before creating the organization profile.

* *Feature:* **"Save Draft"** allows you to pause and resume setup later.

### 2. Dashboard (`/dashboard`)

The command center provides a real-time overview of your business:
* **Key Metrics:**
  * **Total Projects:** Active campaigns/projects running.
  * **Total Leads:** Size of your customer database.
  * **AI Calls Made:** Real-time counter of automated calls.
* **Activity Feed:** Live updates on team actions, lead status changes, and completed calls.
* **Auto-Refresh:** Data updates automatically every 30 seconds.

### 3. Lead Management via CRM (`/dashboard/leads`)

A powerful CRM to manage potential clients:
* **Views:** Switch between Kanban board and List view.
* **Smart Actions:**
  * **Listen to Calls:** Click the **Volume Icon (🔊)** to play AI call recordings directly in the row.
  * **Expand Rows:** View detailed call transcripts, notes, and AI summaries.
  * **Edit Leads:** Update details or change status manually.
* **Status Workflow:** New → Contacted → Qualified → Converted → Lost.

### 4. AI Campaigns & Automation (`/dashboard/campaigns`)

The core automation engine:
* **Campaign Creation:**
  * Define campaign name and goal.
  * Select target audience (leads).
  * Configure **AI Voice** (Alloy, Echo, Shimmer) & Language.
  * Set **Script** for the AI to follow.
* **Execution:**
  * **Start Campaign:** Triggers simultaneous AI calls to all selected leads.
  * **Real-time Monitoring:** Watch statuses change live (e.g., "Initiated" → "In Progress" → "Completed").
  * **Compliance:** Checks calling hours (9 AM - 9 PM) and DND status before dialing.

### 5. Project Management (`/dashboard/projects`)

Organize your real estate projects:
* Track timelines, budgets, and milestones.
* Assign specific leads to projects for better attribution.

### 6. Team & HR (`/dashboard/employees`)

Manage your workforce:
* **Directory:** List of all employees and roles.
* **Access Control:**
  * **Admins:** Full access to settings and billing.
  * **Managers:** Can run campaigns and view team stats.
  * **Employees:** Limited to lead handling and basic tasks.

---

## 🤖 Deep Dive: Real-time AI Calling System

Vantage uses cutting-edge AI to humanize automated calling.

### The Process

1. **Trigger:** Admin starts a campaign.
2. **Connection:** System uses **Plivo** to dial the lead's phone.
3. **Conversation:**
    * **Streaming:** Audio is streamed via WebSockets to OpenAI.
    * **Intelligence:** GPT-4o processes speech in real-time.
    * **Response:** AI replies instantly with a natural, human-like voice.
4. **Outcome:**
    * **Interest Detected:** Lead is marked "Qualified" and call can be transferred to a human agent.
    * **Not Interested:** Lead is marked "Lost".
    * **Voicemail:** AI leaves a polite message.
    * **Data:** Transcript and Recording are saved to the CRM.

### Technical Requirements

To run AI calls, the system requires:
* **HTTPS Domain:** (Production or Ngrok) for WebSocket security.
* **API Keys:** OpenAI (Realtime API) and Plivo (Voice API).
* **Funds:** Credits in both OpenAI and Plivo accounts.

---

## 📚 Documentation Index

All detailed guides are located in the `docs/` folder:

* [📥 Setup Guide](./SETUP.md)
* [🛠️ AI Configuration](./CONFIGURE_ENV.md)
* [🧪 Testing Guide](./TESTING_GUIDE.md)
* [📄 API Reference](./DOCUMENTATION.md)
