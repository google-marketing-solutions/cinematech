# 🎬 CinemaTech Video Generator

This is a web-based visual storytelling platform to enable advertisers create text to proffesional video ads at scale

## 🚀 Getting Started

To get the project up and running on your local machine, follow these simple steps.

### ✅ Prerequisites

You need to have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your system.

### 🛠️ Installation

1.  Clone the repository to your local machine:
    ```bash
    git clone https://github.com/google-marketing-solutions/cinematech.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd cinematech
    ```
3.  Install the required dependencies:
    ```bash
    npm install
    ```

### 🏃 Running the Application

To start the development server, run the following command:

```bash
npm run dev
```

The application will be available at `http://localhost:3001`.

## 📖 How to Use

1.  **✍️ Create a Project:** On the left-hand panel, enter a name for your new project and click "Create Project."
2.  **📂 Select a Project:** Click on a project name in the list to open it.
3.  **📝 Add Scenes:** Use the "Prompt" section to describe the scenes for your video. Each prompt will be treated as a separate scene.
4.  **🖼️ Generate Media:**
    *   For each scene, you can generate an image by clicking the "Generate image" button.
    *   Once you have an image, you can generate a video for that scene by clicking the "Generate video" button.
5.  **💾 Manage Media:** You can upload, download, or delete the media for each scene using the icons in the media slots.

## ✨ Features and Benefits

*   **🤖 AI-Powered Generation:** Automatically create images and video clips from simple text descriptions.
*   **🎬 Scene-Based Workflow:** Break down your story into individual scenes, making it easy to manage and organize your video project.
*   **⚡ Rapid Prototyping:** Quickly visualize your ideas and create video prototypes without needing complex video editing software.
*   **🎨 Creative Storytelling:** A powerful tool for writers, marketers, and creators to bring their stories to life through video.
*   **📦 Media Management:** Easily upload your own assets, download generated content, and manage your project files.

## ⚙️ Configuration

To use the AI-powered features of this application, you will need to configure it with your Google Cloud Platform (GCP) credentials. You can do this from the "Config" page within the application.

| Setting | Description |
| :--- | :--- |
| **Gemini Text Model** | The name of the Gemini model to use for text generation (e.g., `gemini-2.5-pro`). |
| **Vertex Video Model** | The name of the Vertex AI model for video generation (e.g., `veo-3.1-generate-001`). |
| **Vertex Image Model** | The name of the Vertex AI model for image generation (e.g., `imagen-4.0-ultra-generate`). |
| **Google Cloud Project ID** | Your GCP project ID. |
| **GCS Bucket Name** | The name of the Google Cloud Storage bucket where your media files will be stored. |
| **GCP Location ID** | The GCP location where your resources are hosted (e.g., `us-central1`). |

> **Note:** You will need a Google Cloud Platform account with the Vertex AI and Cloud Storage APIs enabled to obtain these values.

## ℹ️ Icon Legend

| Icon | Description |
| :--- | :--- |
| **&#8635;** | **Redo/Generate:** Generates or re-generates the media (image or video). |
| **&#8679;** | **Upload:** Upload your own image or video file. |
| **&#128465;** | **Delete Media:** Deletes the image or video from the scene. |
| **&#8681;** | **Download:** Downloads the media to your local machine. |
| **&#10534;** | **Upscale:** Enhances the resolution of the generated image. |
| **<** | **Collapse Panel:** Hides the project list panel. |
| **>** | **Expand Panel:** Shows the project list panel. |
| **&#128465;** | **Delete Project:** Deletes the entire project. |

## ☁️ Deployment

The project includes scripts for deploying to Firebase hosting.

*   **Development:**
    ```bash
    npm run deploy-dev
    ```
*   **Production:**
    ```bash
    npm run deploy-prod
