package com.example.sgms.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class PdfReportService {

    public byte[] generatePdf(String htmlFileName) {
        try {
            // Read HTML content from classpath (static directory)
            ClassPathResource resource = new ClassPathResource("static/" + htmlFileName);
            String htmlContent;
            try (InputStream is = resource.getInputStream()) {
                htmlContent = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
            
            // Inject styles similarly to Puppeteer script to hide UI elements
            String styleTag = "<style>" +
                    ".navbar, .background-animation, .status-indicator-nav { display: none !important; }\n" +
                    "body { background: #0f172a !important; color: #e2e8f0 !important; margin: 0 !important; padding: 0 !important; }\n" +
                    ".doc-content { margin: 0 !important; padding: 40px !important; border: none !important; box-shadow: none !important; max-width: 100% !important; }\n" +
                    "h1, h2, h3, h4, h5, h6 { color: #f8fafc !important; }\n" +
                    "p, li, td, th { color: #cbd5e1 !important; }\n" +
                    "a { color: #3b82f6 !important; text-decoration: none !important; }\n" +
                    "button, .btn { display: none !important; }" +
                    "</style>";
            
            // Append style to head
            if (htmlContent.contains("</head>")) {
                htmlContent = htmlContent.replace("</head>", styleTag + "</head>");
            } else {
                htmlContent = styleTag + htmlContent;
            }

            try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
                PdfRendererBuilder builder = new PdfRendererBuilder();
                builder.useFastMode();
                // Base URI not strictly needed unless loading external assets (like images)
                // Assuming it's self-contained or assets are absolute/inlined.
                builder.withHtmlContent(htmlContent, "/");
                builder.toStream(os);
                builder.run();
                return os.toByteArray();
            }
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage(), e);
        }
    }
}
