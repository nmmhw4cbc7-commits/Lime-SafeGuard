# 🛡️ Lime SafeGuard

> A real-time fake shop scanner that helps you assess whether an online store looks trustworthy before you buy.

[Lime SafeGuard on GitHub](https://github.com/nmmhw4cbc7-commits/Lime-SafeGuard?utm_source=chatgpt.com)

## 🚀 Overview

**Lime SafeGuard** is a web-based **fake shop scanner**.

Simply enter the URL of an online shop and Lime SafeGuard analyzes the website and returns an overall assessment of its trustworthiness.

The goal is simple:

**Paste a shop URL → scan it → understand the risk.**

Unlike a simple frontend demo, Lime SafeGuard is designed as a functional scanner with backend/database integration and actual analysis logic.

## ✨ Features

* 🔎 **URL Scanner** — Enter the URL of an online shop
* 🛡️ **Fake Shop Detection** — Analyze websites for potential warning signs
* 📊 **Trust Assessment** — Get an understandable evaluation of the scanned website
* ⚡ **Modern Web Interface** — Fast and responsive UI
* 🌐 **Web-based** — No installation required
* 🗄️ **Supabase Integration** — Backend functionality and data handling
* 📱 **Responsive Design** — Works across desktop and mobile devices

## 🧠 How It Works

1. Enter the URL of an online shop.
2. Lime SafeGuard analyzes the provided website.
3. Relevant indicators are evaluated.
4. The scanner generates an overall assessment.
5. The result helps you decide whether further investigation is necessary.

> ⚠️ Lime SafeGuard is an analysis tool and should not be treated as an absolute guarantee that a shop is legitimate or fraudulent.

## 🛠️ Tech Stack

* **TypeScript**
* **React**
* **Vite**
* **Supabase**
* **Bun / npm**
* **Tailwind CSS**
* **shadcn/ui**

## 📂 Project Structure

```text
Lime-SafeGuard/
├── public/          # Static assets
├── src/             # Application source code
├── supabase/        # Supabase configuration and backend logic
├── .lovable/        # Lovable project configuration
├── package.json     # Dependencies and scripts
├── vite.config.ts   # Vite configuration
├── tsconfig.json    # TypeScript configuration
└── README.md
```

## 💻 Local Development

### Requirements

Make sure you have one of the following installed:

* Node.js
* npm
* Bun

### Clone the repository

```bash
git clone https://github.com/nmmhw4cbc7-commits/Lime-SafeGuard.git
cd Lime-SafeGuard
```

### Install dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

### Start the development server

```bash
npm run dev
```

Or:

```bash
bun run dev
```

The application will then be available through the local Vite development server.

## 🔐 Environment Variables

If the application requires Supabase or other external services, create a `.env` file based on the variables required by the project.

**Never commit private API keys, service-role keys, passwords, or other secrets to GitHub.**

## 🌍 Live Demo

Try Lime SafeGuard online:

[Open Lime SafeGuard](https://fake-shop-detect.lovable.app?utm_source=chatgpt.com)

## 🎯 Project Goals

Lime SafeGuard was created to make it easier for users to recognize potentially dangerous online shops **before entering payment or personal information**.

The project focuses on making technical website analysis understandable for everyday users.

## ⚠️ Disclaimer

Lime SafeGuard provides an automated assessment based on the information available to its scanner.

A positive result does **not** guarantee that a website is legitimate, and a negative result does **not** automatically mean that a website is fraudulent.

Always verify important information yourself before making a purchase.

## 📄 License

This project does not currently specify a license.

If you intend to allow others to use, modify, or redistribute the code, consider adding an appropriate open-source license.

---

Made with 💚 by **Philipp Dachtler**
