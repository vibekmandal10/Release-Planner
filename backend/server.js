const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

// Add these email configuration constants after the existing constants
const nodemailer = require("nodemailer");

// Email configuration
const SMTP_CONFIG = {
  host: "umg.corp.amdocs.com",
  port: 25,
  secure: false, // true for 465, false for other ports
  auth: null, // No authentication required for internal SMTP
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
};

const EMAIL_SETTINGS = {
  fromEmail: "release-management@amdocs.com",
  fromName: "Release Management System",
  maxRecipients: 50,
  allowedDomains: ["amdocs.com", "gmail.com", "outlook.com", "yahoo.com"], // Add your allowed domains
};

// Function to get release version features
const getReleaseVersionFeatures = async (releaseVersionName) => {
  try {
    const availableReleases = await readAvailableReleases();
    const releaseVersion = availableReleases.find(
      (release) => release.name === releaseVersionName
    );
    return releaseVersion?.features || [];
  } catch (error) {
    console.error("Error fetching release version features:", error);
    return [];
  }
};

// Build a plain text version of the release email
const buildPlainTextReleaseEmail = (releaseData, features = []) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Build features text section
  const buildFeaturesText = () => {
    if (!features || features.length === 0) {
      return `
RELEASE FEATURES
================
No specific features documented for this release version.
`;
    }

    const featuresText = features
      .map((feature, index) => {
        let featureInfo = `${index + 1}. ${feature.name}`;
        if (feature.type) featureInfo += ` [${feature.type}]`;
        if (feature.priority) featureInfo += ` (${feature.priority} Priority)`;
        featureInfo += `\n   ${feature.description}`;
        return featureInfo;
      })
      .join("\n\n");

    return `
RELEASE FEATURES (${features.length})
${"=".repeat(20 + features.length.toString().length)}
${featuresText}
`;
  };

  return `RELEASE NOTIFICATION
===================

Release Version: ${releaseData.release_version}
Account: ${releaseData.account_name}
Region: ${releaseData.region}
Status: ${releaseData.status}

RELEASE DETAILS
===============
Release Date: ${formatDate(releaseData.release_date)}
Executor: ${releaseData.executor}${
    releaseData.completion_date
      ? `
Completion Date: ${formatDate(releaseData.completion_date)} ${formatTime(
          releaseData.completion_date
        )}`
      : ""
  }${
    releaseData.time_taken_hours
      ? `
Duration: ${releaseData.time_taken_hours} hours`
      : ""
  }
Defects Raised: ${releaseData.defects_raised || "0"}

${buildFeaturesText()}${
    releaseData.notes
      ? `
RELEASE NOTES
=============
${releaseData.notes}
`
      : ""
  }${
    releaseData.completion_notes
      ? `
COMPLETION NOTES
================
${releaseData.completion_notes}
`
      : ""
  }${
    releaseData.defect_details
      ? `
DEFECT DETAILS
==============
${releaseData.defect_details}
`
      : ""
  }

---
This email was generated automatically by the Release Management System
Generated on ${new Date().toLocaleString()}`;
};

// Build Outlook-compatible HTML email template with better structure
// const buildReleaseEmailTemplate = (releaseData, features = []) => {
//   const formatDate = (dateString) => {
//     if (!dateString) return "Not specified";
//     return new Date(dateString).toLocaleDateString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   const formatTime = (dateString) => {
//     if (!dateString) return "";
//     return new Date(dateString).toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case "completed":
//         return "#28a745";
//       case "in-progress":
//         return "#ffc107";
//       case "blocked":
//         return "#dc3545";
//       case "scheduled":
//         return "#007bff";
//       default:
//         return "#6c757d";
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status?.toLowerCase()) {
//       case "completed":
//         return "✅";
//       case "in-progress":
//         return "🔄";
//       case "blocked":
//         return "🚫";
//       case "scheduled":
//         return "📅";
//       default:
//         return "📋";
//     }
//   };

//   const getFeatureTypeIcon = (type) => {
//     switch (type) {
//       case "New Feature":
//         return "🆕";
//       case "Enhancement":
//         return "⚡";
//       case "Bug Fix":
//         return "🐛";
//       case "Security":
//         return "🔒";
//       case "Performance":
//         return "🚀";
//       default:
//         return "📋";
//     }
//   };

//   const getPriorityColor = (priority) => {
//     switch (priority?.toLowerCase()) {
//       case "critical":
//         return "#dc3545";
//       case "high":
//         return "#fd7e14";
//       case "medium":
//         return "#ffc107";
//       case "low":
//         return "#28a745";
//       default:
//         return "#6c757d";
//     }
//   };

//   // Build features HTML section
//   const buildFeaturesSection = () => {
//     if (!features || features.length === 0) {
//       return `
//         <tr>
//           <td style="padding: 20px 0; border-top: 2px solid #e9ecef;">
//             <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">🚀 Release Features</h3>
//             <p style="color: #6c757d; margin: 0; font-style: italic;">No specific features documented for this release version.</p>
//           </td>
//         </tr>
//       `;
//     }

//     const featuresHtml = features
//       .map(
//         (feature) => `
//       <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; margin-bottom: 12px;">
//         <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
//           <div style="display: flex; gap: 10px; align-items: center;">
//             <span style="background: #e9ecef; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #495057;">
//               ${getFeatureTypeIcon(feature.type)} ${feature.type || "Feature"}
//             </span>
//             ${
//               feature.priority
//                 ? `
//               <span style="background: ${getPriorityColor(
//                 feature.priority
//               )}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
//                 ${feature.priority}
//               </span>
//             `
//                 : ""
//             }
//           </div>
//         </div>
//         <h4 style="margin: 0 0 8px 0; color: #212529; font-size: 16px;">${
//           feature.name
//         }</h4>
//         <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">${
//           feature.description
//         }</p>
//       </div>
//     `
//       )
//       .join("");

//     return `
//       <tr>
//         <td style="padding: 20px 0; border-top: 2px solid #e9ecef;">
//           <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">🚀 Release Features (${features.length})</h3>
//           ${featuresHtml}
//         </td>
//       </tr>
//     `;
//   };

//   return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
// <html xmlns="http://www.w3.org/1999/xhtml">
// <head>
//     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//     <title>Release Notification - ${releaseData.release_version}</title>
//     <!--[if mso]>
//     <style type="text/css">
//         table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
//         td { mso-line-height-rule: exactly; }
//     </style>
//     <![endif]-->
// </head>
// <body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
//     <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
//         <!-- Header -->
//         <tr>
//             <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
//                 <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
//                     📋 Release Notification
//                 </h1>
//                 <p style="color: #f8f9fa; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
//                     ${releaseData.release_version} • ${releaseData.account_name}
//                 </p>
//             </td>
//         </tr>

//         <!-- Content -->
//         <tr>
//             <td style="padding: 40px;">
//                 <!-- Status Badge -->
//                 <div style="text-align: center; margin-bottom: 30px;">
//                     <span style="background-color: ${getStatusColor(
//                       releaseData.status
//                     )}; color: #ffffff; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
//                         ${getStatusIcon(releaseData.status)} ${
//     releaseData.status
//   }
//                     </span>
//                 </div>

//                 <!-- Release Information -->
//                 <table cellpadding="0" cellspacing="0" border="0" width="100%">
//                     <tr>
//                         <td style="padding-bottom: 25px;">
//                             <h2 style="color: #495057; margin: 0 0 20px 0; font-size: 22px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
//                                 📊 Release Details
//                             </h2>

//                             <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
//                                 <tr>
//                                     <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">🏷️ Version:</strong>
//                                         <span style="color: #212529; font-weight: 600;">${
//                                           releaseData.release_version
//                                         }</span>
//                                     </td>
//                                 </tr>
//                                 <tr>
//                                     <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">🏢 Account:</strong>
//                                         <span style="color: #212529;">${
//                                           releaseData.account_name
//                                         }</span>
//                                     </td>
//                                 </tr>
//                                 <tr>
//                                     <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">🌍 Region:</strong>
//                                         <span style="color: #212529;">${
//                                           releaseData.region
//                                         }</span>
//                                     </td>
//                                 </tr>
//                                 <tr>
//                                     <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">📅 Release Date:</strong>
//                                         <span style="color: #212529;">${formatDate(
//                                           releaseData.release_date
//                                         )}</span>
//                                     </td>
//                                 </tr>
//                                 <tr>
//                                     <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">👤 Executor:</strong>
//                                         <span style="color: #212529;">${
//                                           releaseData.executor
//                                         }</span>
//                                     </td>
//                                 </tr>
//                                 ${
//                                   releaseData.completion_date
//                                     ? `
//                                 <tr>
//                                     <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">✅ Completed:</strong>
//                                         <span style="color: #212529;">${formatDate(
//                                           releaseData.completion_date
//                                         )} ${formatTime(
//                                         releaseData.completion_date
//                                       )}</span>
//                                     </td>
//                                 </tr>
//                                 `
//                                     : ""
//                                 }
//                                 ${
//                                   releaseData.time_taken_hours
//                                     ? `
//                                 <tr>
//                                     <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">⏱️ Duration:</strong>
//                                         <span style="color: #212529;">${releaseData.time_taken_hours} hours</span>
//                                     </td>
//                                 </tr>
//                                 `
//                                     : ""
//                                 }
//                                 <tr>
//                                     <td style="padding: 8px 0;">
//                                         <strong style="color: #495057; display: inline-block; width: 140px;">🐛 Defects:</strong>
//                                         <span style="color: #212529;">${
//                                           releaseData.defects_raised || "0"
//                                         }</span>
//                                     </td>
//                                 </tr>
//                             </table>
//                         </td>
//                     </tr>

//                     ${buildFeaturesSection()}

//                     ${
//                       releaseData.notes
//                         ? `
//                     <tr>
//                         <td style="padding: 20px 0; border-top: 2px solid #e9ecef;">
//                             <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">📝 Release Notes</h3>
//                             <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px 20px; border-radius: 0 6px 6px 0;">
//                                 <p style="margin: 0; color: #495057; white-space: pre-wrap;">${releaseData.notes}</p>
//                             </div>
//                         </td>
//                     </tr>
//                     `
//                         : ""
//                     }

//                     ${
//                       releaseData.completion_notes
//                         ? `
//                     <tr>
//                         <td style="padding: 20px 0; border-top: 2px solid #e9ecef;">
//                             <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">✅ Completion Notes</h3>
//                             <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px 20px; border-radius: 0 6px 6px 0;">
//                                 <p style="margin: 0; color: #495057; white-space: pre-wrap;">${releaseData.completion_notes}</p>
//                             </div>
//                         </td>
//                     </tr>
//                     `
//                         : ""
//                     }

//                     ${
//                       releaseData.defect_details
//                         ? `
//                     <tr>
//                         <td style="padding: 20px 0; border-top: 2px solid #e9ecef;">
//                             <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">🐛 Defect Details</h3>
//                             <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 0 6px 6px 0;">
//                                 <p style="margin: 0; color: #856404; white-space: pre-wrap;">${releaseData.defect_details}</p>
//                             </div>
//                         </td>
//                     </tr>
//                     `
//                         : ""
//                     }
//                 </table>
//             </td>
//         </tr>

//         <!-- Footer -->
//         <tr>
//             <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #dee2e6;">
//                 <p style="margin: 0; color: #6c757d; font-size: 12px;">
//                     📧 This email was generated automatically by the Release Management System<br>
//                     🕒 Generated on ${new Date().toLocaleString()}
//                 </p>
//             </td>
//         </tr>
//     </table>
// </body>
// </html>`;
// };

// Build Outlook-compatible HTML email template with professional styling
const buildReleaseEmailTemplate = (releaseData, features = []) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#28a745";
      case "in-progress":
        return "#17a2b8";
      case "blocked":
        return "#dc3545";
      case "scheduled":
        return "#007bff";
      default:
        return "#6c757d";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "✅";
      case "in-progress":
        return "🔄";
      case "blocked":
        return "🚫";
      case "scheduled":
        return "📅";
      default:
        return "📋";
    }
  };

  const getFeatureTypeIcon = (type) => {
    switch (type) {
      case "New Feature":
        return "🆕";
      case "Enhancement":
        return "⚡";
      case "Bug Fix":
        return "🔷";
      case "Security":
        return "🔒";
      case "Performance":
        return "🚀";
      default:
        return "📋";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "#dc3545";
      case "high":
        return "#fd7e14";
      case "medium":
        return "#ffc107";
      case "low":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "#ffffff";
      case "high":
        return "#ffffff";
      case "medium":
        return "#212529";
      case "low":
        return "#ffffff";
      default:
        return "#ffffff";
    }
  };

  // Build features HTML section with professional styling
  const buildFeaturesSection = () => {
    if (!features || features.length === 0) {
      return `
        <tr>
          <td style="padding: 30px 0; border-top: 3px solid #e9ecef;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; border: 1px solid #dee2e6;">
                  <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">
                    🚀 Release Features
                  </h3>
                  <p style="color: #6c757d; margin: 0; font-style: italic; font-size: 15px;">
                    No specific features documented for this release version.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    const featuresHtml = features
      .map(
        (feature) => `
        <tr>
          <td style="padding: 0 0 15px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e3e6ea; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
              <tr>
                <td style="padding: 20px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    
                    <tr>
                      <td style="padding-bottom: 8px;">
                        <h4 style="margin: 0; color: #202124; font-size: 16px; font-weight: 600; line-height: 1.3;">
                          ${feature.name}
                        </h4>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="margin: 0; color: #5f6368; font-size: 14px; line-height: 1.5;">
                          ${feature.description}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        `
      )
      .join("");

    return `
      <tr>
        <td style="padding: 30px 0; border-top: 3px solid #e9ecef;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom: 20px;">
                <h3 style="color: #202124; margin: 0; font-size: 22px; font-weight: 600;">
                  🚀 Release Features
                  <span style="background: linear-gradient(135deg, #4285f4 0%, #34a853 100%); color: #ffffff; padding: 4px 12px; border-radius: 15px; font-size: 14px; font-weight: 600; margin-left: 10px;">
                    ${features.length}
                  </span>
                </h3>
              </td>
            </tr>
            ${featuresHtml}
          </table>
        </td>
      </tr>
    `;
  };

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Release Notification - ${releaseData.release_version}</title>
    <!--[if mso]>
    <style type="text/css">
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        td { mso-line-height-rule: exactly; }
        .gradient-bg { background: #4285f4 !important; }
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.6; color: #202124; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh;">

    <!-- Main Container -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 750px; margin: 0 auto;">
        <tr>
            <td>
                <!-- Email Card -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden; border: 1px solid #e8eaed;">

                    <!-- Header -->
                    <tr>
                        <td style="background: #4285f4;">
                            
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2); letter-spacing: -0.5px;">
                                            📋 Release Notification
                                        </h1>
                                        
                                        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px; font-weight: 500;">
                                            ${releaseData.release_version} • ${
    releaseData.account_name
  }
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">

                                <!-- Status Badge -->
                                <tr>
                                    <td style="text-align: center; padding-bottom: 35px;">
                                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="background: ${getStatusColor(
                                                  releaseData.status
                                                )}; color: #ffffff; padding: 15px 30px; border-radius: 30px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                                    ${getStatusIcon(
                                                      releaseData.status
                                                    )} ${releaseData.status}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Release Information -->
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 25px;">
                                                    <h2 style="color: #202124; margin: 0; font-size: 24px; font-weight: 600; border-bottom: 3px solid #4285f4; padding-bottom: 12px; display: inline-block;">
                                                        📊 Release Details
                                                    </h2>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 12px; padding: 25px; border: 1px solid #e8eaed; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                                                        <tr>
                                                            <td style="padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                    <tr>
                                                                        <td style="width: 160px; vertical-align: top;">
                                                                            <strong style="color: #5f6368; font-size: 14px; font-weight: 600;">🏷️ Version:</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span style="color: #202124; font-weight: 600; font-size: 15px;">${
                                                                              releaseData.release_version
                                                                            }</span>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                    <tr>
                                                                        <td style="width: 160px; vertical-align: top;">
                                                                            <strong style="color: #5f6368; font-size: 14px; font-weight: 600;">🏢 Account:</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span style="color: #202124; font-size: 15px;">${
                                                                              releaseData.account_name
                                                                            }</span>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                    <tr>
                                                                        <td style="width: 160px; vertical-align: top;">
                                                                            <strong style="color: #5f6368; font-size: 14px; font-weight: 600;">🌍 Region:</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span style="color: #202124; font-size: 15px;">${
                                                                              releaseData.region
                                                                            }</span>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                    <tr>
                                                                        <td style="width: 160px; vertical-align: top;">
                                                                            <strong style="color: #5f6368; font-size: 14px; font-weight: 600;">📅 Release Date:</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span style="color: #202124; font-size: 15px;">${formatDate(
                                                                              releaseData.release_date
                                                                            )}</span>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                    <tr>
                                                                        <td style="width: 160px; vertical-align: top;">
                                                                            <strong style="color: #5f6368; font-size: 14px; font-weight: 600;">👤 Executor:</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span style="color: #202124; font-size: 15px;">${
                                                                              releaseData.executor
                                                                            }</span>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        ${
                                                          releaseData.completion_date
                                                            ? `
                                                        <tr>
                                                            <td style="padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                    <tr>
                                                                        <td style="width: 160px; vertical-align: top;">
                                                                            <strong style="color: #5f6368; font-size: 14px; font-weight: 600;">✅ Completed:</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span style="color: #202124; font-size: 15px;">${formatDate(
                                                                              releaseData.completion_date
                                                                            )} </span>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        `
                                                            : ""
                                                        }
                                                        ${
                                                          releaseData.time_taken_hours
                                                            ? `
                                                        <tr>
                                                            <td style="padding: 12px 0; border-bottom: 1px solid #e8eaed;">
                                                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                    <tr>
                                                                        <td style="width: 160px; vertical-align: top;">
                                                                            <strong style="color: #5f6368; font-size: 14px; font-weight: 600;">⏱️ Duration:</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span style="color: #202124; font-size: 15px;">${releaseData.time_taken_hours} hours</span>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                        `
                                                            : ""
                                                        }
                                                        
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                ${buildFeaturesSection()}

                                ${
                                  releaseData.notes
                                    ? `
                                <tr>
                                    <td style="padding: 30px 0; border-top: 3px solid #e9ecef;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 15px;">
                                                    <h3 style="color: #202124; margin: 0; font-size: 20px; font-weight: 600;">📝 Release Notes</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-left: 4px solid #2196f3; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                                                        <tr>
                                                            <td>
                                                                <p style="margin: 0; color: #1565c0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${releaseData.notes}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                `
                                    : ""
                                }

                                ${
                                  releaseData.completion_notes
                                    ? `
                                <tr>
                                    <td style="padding: 30px 0; border-top: 3px solid #e9ecef;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 15px;">
                                                    <h3 style="color: #202124; margin: 0; font-size: 20px; font-weight: 600;">✅ Completion Notes</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%); border-left: 4px solid #4caf50; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                                                        <tr>
                                                            <td>
                                                                <p style="margin: 0; color: #2e7d32; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${releaseData.completion_notes}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                `
                                    : ""
                                }

                                ${
                                  releaseData.defect_details
                                    ? `
                                <tr>
                                    <td style="padding: 30px 0; border-top: 3px solid #e9ecef;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 15px;">
                                                    <h3 style="color: #202124; margin: 0; font-size: 20px; font-weight: 600;">🔷 Defect Details</h3>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%); border-left: 4px solid #1a73e8; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                                                        <tr>
                                                            
                                                            <td>
                                                              ${releaseData.defects
                                                                .map(
                                                                  (defect) => `
                                                                      <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
                                                                        <a href="https://deljira/browse/${defect.defect_id}" 
                                                                           style="color: #1a73e8; text-decoration: none; font-weight: 600;"
                                                                           target="_blank">
                                                                           ${defect.defect_id}
                                                                        </a>: ${defect.description}
                                                                      </p>
                                                                    `
                                                                )
                                                                .join("")}
                                                            </td>

                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                `
                                    : ""
                                }
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; font-weight: 500;">
                                            📧 This email was generated automatically by the Release Management System
                                        </p>
                                        <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                                            🕒 Generated on ${new Date().toLocaleString(
                                              "en-US",
                                              {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              }
                                            )}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};
// const buildReleaseEmailTemplate = (release) => {
//   const statusColor =
//     release.status === "Blocked"
//       ? "#D92D20"
//       : release.status === "Scheduled"
//       ? "#F79009"
//       : "#12B76A";

//   return `
//   <div style="margin:0;padding:0;background:#f6f8fa;font-family:'Segoe UI',Arial,sans-serif;color:#333;">
//     <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:700px;margin:auto;background:#ffffff;border-radius:10px;box-shadow:0 3px 12px rgba(0,0,0,0.08);overflow:hidden;">
//       <tr>
//         <td style="background:linear-gradient(90deg,#0078D7,#005A9E);color:white;padding:20px 30px;text-align:left;">
//           <h2 style="margin:0;font-size:22px;">🚀 Release Notification</h2>
//           <p style="margin:5px 0 0;font-size:15px;">Version: <strong>${
//             release.release_version
//           }</strong></p>
//         </td>
//       </tr>
//       <tr>
//         <td style="padding:25px 30px;">
//           <p style="margin:0 0 15px;">Dear <strong>Operations Team</strong>,</p>
//           <p style="margin:0 0 25px;">Please find below the details for the upcoming release.</p>

//           <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px;">
//             <tbody>
//               <tr style="background:#f9fafb;">
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;width:40%;"><strong>🏷️ Release Version</strong></td>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;">${
//                   release.release_version
//                 }</td>
//               </tr>
//               <tr>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;"><strong>🏢 Account Name</strong></td>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;">${
//                   release.account_name
//                 }</td>
//               </tr>
//               <tr style="background:#f9fafb;">
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;"><strong>🌍 Region</strong></td>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;">${
//                   release.region || "-"
//                 }</td>
//               </tr>
//               <tr>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;"><strong>📅 Release Date</strong></td>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;">${
//                   release.release_date
//                 }</td>
//               </tr>
//               <tr style="background:#f9fafb;">
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;"><strong>👤 Executor</strong></td>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;">${
//                   release.executor
//                 }</td>
//               </tr>
//               <tr>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;"><strong>📊 Status</strong></td>
//                 <td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:bold;color:${statusColor};">${
//     release.status
//   }</td>
//               </tr>
//             </tbody>
//           </table>

//           ${
//             release.notes
//               ? `
//             <div style="margin-top:25px;">
//               <h3 style="font-size:16px;color:#0078D7;margin-bottom:8px;">📝 Notes</h3>
//               <div style="padding:12px 15px;background:#f3f4f6;border-radius:6px;border:1px solid #e5e7eb;white-space:pre-wrap;line-height:1.5;">
//                 ${release.notes.replace(/\n/g, "<br>")}
//               </div>
//             </div>`
//               : ""
//           }

//           <div style="margin-top:30px;background:#eef6ff;border-left:4px solid #0078D7;padding:12px 15px;border-radius:6px;">
//             ✅ Please ensure all necessary pre-checks are completed before the scheduled release date.
//           </div>

//           <p style="margin-top:25px;">For questions or assistance, contact the <strong>Release Management Team</strong>.</p>

//           <hr style="margin:35px 0 20px;border:none;border-top:1px solid #ddd;">
//           <p style="font-size:12px;color:#666;text-align:center;">
//             📧 Release Management System | Confidential Information
//           </p>
//         </td>
//       </tr>
//     </table>
//   </div>
//   `;
// };

//Email helper functions
const createEmailTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.log("SMTP connection error:", error);
      } else {
        console.log("SMTP server is ready to take our messages");
      }
    });

    return transporter;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    throw error;
  }
};

const validateEmailAddresses = (emails) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = [];
  const errors = [];

  // Convert to array if string
  const emailArray = Array.isArray(emails) ? emails : [emails];

  emailArray.forEach((email) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.push("Empty email address found");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      errors.push(`Invalid email format: ${trimmedEmail}`);
      return;
    }

    // Check domain if restrictions are enabled
    const domain = trimmedEmail.split("@")[1].toLowerCase();
    if (
      EMAIL_SETTINGS.allowedDomains.length > 0 &&
      !EMAIL_SETTINGS.allowedDomains.includes(domain)
    ) {
      errors.push(`Domain not allowed: ${domain} (${trimmedEmail})`);
      return;
    }

    validEmails.push(trimmedEmail);
  });

  return { validEmails, errors };
};

// Function to send email to multiple recipients with CC support
const sendEmail = async (
  recipients,
  subject,
  body,
  releaseId = null,
  ccRecipients = null,
  bccRecipients = null,
  releaseData = null
) => {
  let transporter = null;

  try {
    transporter = createEmailTransporter();

    // Validate TO recipients
    const { validEmails: validToEmails, errors: toErrors } =
      validateEmailAddresses(recipients);

    // Validate CC recipients if provided
    let validCcEmails = [];
    let ccErrors = [];
    if (ccRecipients && ccRecipients.length > 0) {
      const ccValidation = validateEmailAddresses(ccRecipients);
      validCcEmails = ccValidation.validEmails;
      ccErrors = ccValidation.errors.map((err) => `CC: ${err}`);
    }

    // Validate BCC recipients if provided
    let validBccEmails = [];
    let bccErrors = [];
    if (bccRecipients && bccRecipients.length > 0) {
      const bccValidation = validateEmailAddresses(bccRecipients);
      validBccEmails = bccValidation.validEmails;
      bccErrors = bccValidation.errors.map((err) => `BCC: ${err}`);
    }

    // Combine all errors
    const allErrors = [...toErrors, ...ccErrors, ...bccErrors];
    if (allErrors.length > 0) {
      throw new Error(`Email validation failed: ${allErrors.join("; ")}`);
    }

    // Check total recipient count
    const totalRecipients =
      validToEmails.length + validCcEmails.length + validBccEmails.length;
    if (totalRecipients === 0) {
      throw new Error("No valid recipients found");
    }

    if (totalRecipients > EMAIL_SETTINGS.maxRecipients) {
      throw new Error(
        `Total recipients (${totalRecipients}) exceeds maximum allowed (${EMAIL_SETTINGS.maxRecipients})`
      );
    }

    // Email options optimized for Outlook
    const mailOptions = {
      from: `"${EMAIL_SETTINGS.fromName}" <${EMAIL_SETTINGS.fromEmail}>`,
      to: validToEmails.join(", "),
      subject: subject,
      headers: {
        "X-Release-ID": releaseId || "unknown",
        "X-Mailer": "Release Management System v1.0",
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "MIME-Version": "1.0",
      },
    };

    // Determine content type and set email content
    const isReleaseNotification = releaseData && releaseData.release_version;

    if (isReleaseNotification) {
      // Fetch features for the release version
      const features = await getReleaseVersionFeatures(
        releaseData.release_version
      );

      console.log("📧 Using Release HTML Template");
      console.log(`📋 Release: ${releaseData.release_version}`);
      console.log(`🏢 Account: ${releaseData.account_name}`);
      console.log(`📅 Date: ${releaseData.release_date}`);
      console.log(`📊 Status: ${releaseData.status}`);
      console.log(`🚀 Features: ${features.length} found`);

      if (features.length > 0) {
        console.log("Features included:");
        features.forEach((feature, index) => {
          console.log(
            `  ${index + 1}. ${feature.name} [${feature.type || "Feature"}]${
              feature.priority ? ` (${feature.priority})` : ""
            }`
          );
        });
      }

      mailOptions.html = buildReleaseEmailTemplate(releaseData, features);
      mailOptions.text = buildPlainTextReleaseEmail(releaseData, features);
    } else {
      // For regular emails, use the body as provided and create simple HTML wrapper
      console.log("📧 Using Simple HTML Wrapper");
      mailOptions.text = body;
      mailOptions.html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email</title>
    <!--[if mso]>
    <style type="text/css">
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        td { mso-line-height-rule: exactly; }
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
            <td>
                <pre style="font-family: Arial, Helvetica, sans-serif; white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 14px; line-height: 1.6;">${body}</pre>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    // Add CC if provided
    if (validCcEmails.length > 0) {
      mailOptions.cc = validCcEmails.join(", ");
    }

    // Add BCC if provided
    if (validBccEmails.length > 0) {
      mailOptions.bcc = validBccEmails.join(", ");
    }

    console.log(
      `📤 Sending Outlook-compatible email to ${totalRecipients} total recipients:`
    );
    console.log(`📧 TO (${validToEmails.length}): ${validToEmails.join(", ")}`);
    if (validCcEmails.length > 0) {
      console.log(
        `📧 CC (${validCcEmails.length}): ${validCcEmails.join(", ")}`
      );
    }
    if (validBccEmails.length > 0) {
      console.log(
        `📧 BCC (${validBccEmails.length}): ${validBccEmails.join(", ")}`
      );
    }
    console.log(`📋 Subject: ${subject}`);
    console.log(
      `📄 Content Type: ${
        isReleaseNotification
          ? "Release HTML Template with Features"
          : "Simple HTML"
      }`
    );

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully");
    console.log("📧 Message ID:", info.messageId);
    console.log("📤 Response:", info.response);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      recipients: {
        to: validToEmails,
        cc: validCcEmails,
        bcc: validBccEmails,
      },
      recipientCount: {
        to: validToEmails.length,
        cc: validCcEmails.length,
        bcc: validBccEmails.length,
        total: totalRecipients,
      },
      templateUsed: isReleaseNotification
        ? "Release HTML Template with Features"
        : "Simple HTML",
      featuresIncluded: isReleaseNotification
        ? await getReleaseVersionFeatures(releaseData.release_version)
        : [],
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
};

const app = express();
const PORT = process.env.PORT || 5000;

// Data directory
const DATA_DIR = path.join(__dirname, "data");

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app build directory
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

// File paths
// const DATA_DIR = path.join(__dirname, "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const RELEASES_FILE = path.join(DATA_DIR, "releases.json");
const AVAILABLE_RELEASES_FILE = path.join(DATA_DIR, "available_releases.json"); // Use available_releases.json

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
};

// Initialize data files
const initializeData = async () => {
  await ensureDataDir();

  // Initialize empty available_releases file
  try {
    await fs.access(AVAILABLE_RELEASES_FILE);
  } catch {
    await fs.writeFile(AVAILABLE_RELEASES_FILE, JSON.stringify([], null, 2));
  }

  // Initialize empty accounts file
  try {
    await fs.access(ACCOUNTS_FILE);
  } catch {
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify([], null, 2));
  }

  // Initialize empty releases file
  try {
    await fs.access(RELEASES_FILE);
  } catch {
    await fs.writeFile(RELEASES_FILE, JSON.stringify([], null, 2));
  }
};

// Helper functions
const readAccounts = async () => {
  try {
    const data = await fs.readFile(ACCOUNTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading accounts:", err);
    return [];
  }
};

const writeAccounts = async (accounts) => {
  try {
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  } catch (err) {
    console.error("Error writing accounts:", err);
  }
};

const readReleases = async () => {
  try {
    const data = await fs.readFile(RELEASES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading releases:", err);
    return [];
  }
};

const writeReleases = async (releases) => {
  try {
    await fs.writeFile(RELEASES_FILE, JSON.stringify(releases, null, 2));
  } catch (err) {
    console.error("Error writing releases:", err);
  }
};

const readAvailableReleases = async () => {
  try {
    const data = await fs.readFile(AVAILABLE_RELEASES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading available releases:", err);
    return [];
  }
};

const writeAvailableReleases = async (availableReleases) => {
  try {
    await fs.writeFile(
      AVAILABLE_RELEASES_FILE,
      JSON.stringify(availableReleases, null, 2)
    );
  } catch (err) {
    console.error("Error writing available releases:", err);
  }
};

// Add this function to migrate existing releases
const migrateReleases = async () => {
  try {
    const releases = await readReleases();
    let needsUpdate = false;

    const updatedReleases = releases.map((release) => {
      // Check if release needs migration (missing new fields)
      if (!release.hasOwnProperty("completion_date")) {
        needsUpdate = true;
        return {
          ...release,
          completion_date: null,
          time_taken_hours: null,
          defects_raised: "0",
          defect_details: release.defect_details || "",
          completion_notes: "",
          defects: [],
        };
      }
      return release;
    });

    if (needsUpdate) {
      await writeReleases(updatedReleases);
      console.log("Releases migrated successfully");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
};

// Routes

// Get all available release versions
app.get("/api/regions", async (req, res) => {
  try {
    const availableReleases = await readAvailableReleases();
    res.json(availableReleases.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new release version - UPDATED to support features
app.post("/api/regions", async (req, res) => {
  try {
    const { name, description, features = [] } = req.body; // Added features parameter
    const availableReleases = await readAvailableReleases();

    // Check if release version already exists
    if (
      availableReleases.find(
        (release) => release.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return res.status(400).json({ error: "Release version already exists" });
    }

    const newId = Math.max(...availableReleases.map((r) => r.id), 0) + 1;

    // Process features to ensure they have proper IDs
    const processedFeatures = features.map((feature, index) => ({
      id: feature.id || Date.now() + index,
      name: feature.name,
      description: feature.description,
    }));

    const newRelease = {
      id: newId,
      name: name.toUpperCase(),
      description: description || "",
      features: processedFeatures, // Added features
      created_at: new Date().toISOString(),
    };
    availableReleases.push(newRelease);
    await writeAvailableReleases(availableReleases);
    res.json(newRelease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update release version - UPDATED to support features
app.put("/api/regions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, features = [] } = req.body; // Added features parameter
    const availableReleases = await readAvailableReleases();
    const index = availableReleases.findIndex((r) => r.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: "Release version not found" });
    }

    // Check if name already exists (excluding current release)
    if (
      availableReleases.find(
        (release) =>
          release.name.toLowerCase() === name.toLowerCase() &&
          release.id !== parseInt(id)
      )
    ) {
      return res
        .status(400)
        .json({ error: "Release version name already exists" });
    }

    // Process features to ensure they have proper IDs
    const processedFeatures = features.map((feature, index) => ({
      id: feature.id || Date.now() + index,
      name: feature.name,
      description: feature.description,
    }));

    availableReleases[index] = {
      ...availableReleases[index],
      name: name.toUpperCase(),
      description: description || "",
      features: processedFeatures, // Added features
      updated_at: new Date().toISOString(),
    };

    await writeAvailableReleases(availableReleases);
    res.json({ message: "Release version updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete release version
app.delete("/api/regions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const availableReleases = await readAvailableReleases();
    const releases = await readReleases();

    // Check if release version is being used in any releases
    const releaseInUse = releases.some(
      (release) =>
        release.release_version ===
        availableReleases.find((r) => r.id === parseInt(id))?.name
    );
    if (releaseInUse) {
      return res.status(400).json({
        error: "Cannot delete release version that is being used in releases",
      });
    }

    const filteredReleases = availableReleases.filter(
      (r) => r.id !== parseInt(id)
    );
    await writeAvailableReleases(filteredReleases);
    res.json({ message: "Release version deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all accounts
app.get("/api/accounts", async (req, res) => {
  try {
    const accounts = await readAccounts();
    res.json(accounts.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new account
// app.post("/api/accounts", async (req, res) => {
//   try {
//     const { name, region } = req.body;
//     const accounts = await readAccounts();

//     // Check if account already exists
//     if (accounts.find((acc) => acc.name.toLowerCase() === name.toLowerCase())) {
//       return res.status(400).json({ error: "Account already exists" });
//     }

//     const newId = Math.max(...accounts.map((a) => a.id), 0) + 1;
//     const newAccount = {
//       id: newId,
//       name: name.toUpperCase(),
//       region: region || "",
//       created_at: new Date().toISOString(),
//     };
//     accounts.push(newAccount);
//     await writeAccounts(accounts);
//     res.json(newAccount);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Update account
// app.put("/api/accounts/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, region } = req.body;
//     const accounts = await readAccounts();
//     const index = accounts.findIndex((a) => a.id === parseInt(id));

//     if (index === -1) {
//       return res.status(404).json({ error: "Account not found" });
//     }

//     // Check if name already exists (excluding current account)
//     if (
//       accounts.find(
//         (acc) =>
//           acc.name.toLowerCase() === name.toLowerCase() &&
//           acc.id !== parseInt(id)
//       )
//     ) {
//       return res.status(400).json({ error: "Account name already exists" });
//     }

//     accounts[index] = {
//       ...accounts[index],
//       name: name.toUpperCase(),
//       region: region || "",
//       updated_at: new Date().toISOString(),
//     };

//     await writeAccounts(accounts);
//     res.json({ message: "Account updated successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Update the POST /api/accounts endpoint
app.post("/api/accounts", async (req, res) => {
  try {
    const { name, region, products } = req.body; // Add products to destructuring

    const accounts = await readAccounts();
    const newId = Math.max(...accounts.map((a) => a.id), 0) + 1;

    const newAccount = {
      id: newId,
      name,
      region,
      products: products || [], // Add products field with default empty array
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    accounts.push(newAccount);
    await writeAccounts(accounts);
    res.json(newAccount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the PUT /api/accounts/:id endpoint
app.put("/api/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region, products } = req.body; // Add products to destructuring

    const accounts = await readAccounts();
    const accountIndex = accounts.findIndex((a) => a.id === parseInt(id));

    if (accountIndex === -1) {
      return res.status(404).json({ error: "Account not found" });
    }

    accounts[accountIndex] = {
      ...accounts[accountIndex],
      name,
      region,
      products: products || [], // Add products field with default empty array
      updated_at: new Date().toISOString(),
    };

    await writeAccounts(accounts);
    res.json(accounts[accountIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete account
app.delete("/api/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const accounts = await readAccounts();
    const releases = await readReleases();

    // Check if account is being used in any releases
    const accountInUse = releases.some(
      (release) =>
        release.account_name ===
        accounts.find((a) => a.id === parseInt(id))?.name
    );
    if (accountInUse) {
      return res.status(400).json({
        error: "Cannot delete account that is being used in releases",
      });
    }

    const filteredAccounts = accounts.filter((a) => a.id !== parseInt(id));
    await writeAccounts(filteredAccounts);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all releases with optional filtering
app.get("/api/releases", async (req, res) => {
  try {
    const releases = await readReleases();
    const { product, environment, release_version, account_region, status } = req.query;

    let filteredReleases = releases;

    // Filter by product
    if (product) {
      filteredReleases = filteredReleases.filter(
        (r) => r.product === product
      );
    }

    // Filter by environment
    if (environment) {
      filteredReleases = filteredReleases.filter(
        (r) => r.environment === environment
      );
    }

    // Filter by release version
    if (release_version) {
      filteredReleases = filteredReleases.filter(
        (r) => r.release_version === release_version
      );
    }

    // Filter by account region
    if (account_region) {
      const accounts = await readAccounts();
      const accountsInRegion = accounts
        .filter((acc) => acc.region === account_region)
        .map((acc) => acc.name);
      filteredReleases = filteredReleases.filter((r) =>
        accountsInRegion.includes(r.account_name)
      );
    }

    // Filter by status
    if (status) {
      filteredReleases = filteredReleases.filter((r) => r.status === status);
    }

    res.json(
      filteredReleases.sort(
        (a, b) => new Date(b.release_date) - new Date(a.release_date)
      )
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the POST endpoint for creating releases
// app.post("/api/releases", async (req, res) => {
//   try {
//     const {
//       account_name,
//       release_date,
//       executor,
//       status,
//       notes,
//       release_version,
//       // Add new completion tracking fields
//       completion_date,
//       time_taken_hours,
//       defects_raised,
//       defect_details,
//       completion_notes,
//       defects, // New defects array
//     } = req.body;

//     const releases = await readReleases();
//     const newId = Math.max(...releases.map((r) => r.id), 0) + 1;

//     const newRelease = {
//       id: newId,
//       account_name,
//       release_date,
//       executor,
//       status: status || "Scheduled",
//       notes: notes || "",
//       release_version: release_version || "",
//       // Add new fields
//       completion_date: completion_date || null,
//       time_taken_hours: time_taken_hours || null,
//       defects_raised: defects_raised || "0",
//       defect_details: defect_details || "",
//       completion_notes: completion_notes || "",
//       defects: defects || [], // Store defects array
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     };

//     releases.push(newRelease);
//     await writeReleases(releases);
//     res.json(newRelease);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Update the PUT endpoint for updating releases
// app.put("/api/releases/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       account_name,
//       release_date,
//       executor,
//       status,
//       notes,
//       release_version,
//       // Add new completion tracking fields
//       completion_date,
//       time_taken_hours,
//       defects_raised,
//       defect_details,
//       completion_notes,
//       defects, // New defects array
//     } = req.body;

//     const releases = await readReleases();
//     const index = releases.findIndex((r) => r.id === parseInt(id));

//     if (index === -1) {
//       return res.status(404).json({ error: "Release not found" });
//     }

//     releases[index] = {
//       ...releases[index],
//       account_name,
//       release_date,
//       executor,
//       status,
//       notes: notes || "",
//       release_version: release_version || "",
//       // Update new fields
//       completion_date: completion_date || null,
//       time_taken_hours: time_taken_hours || null,
//       defects_raised: defects_raised || "0",
//       defect_details: defect_details || "",
//       completion_notes: completion_notes || "",
//       defects: defects || [], // Update defects array
//       updated_at: new Date().toISOString(),
//     };

//     await writeReleases(releases);
//     res.json({
//       message: "Release updated successfully",
//       release: releases[index],
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Update the POST /api/releases endpoint
app.post("/api/releases", async (req, res) => {
  try {
    const {
      account_name,
      release_date,
      executor,
      status,
      notes,
      release_version,
      product, // Add product field
      environment, // Add environment field
      // Completion tracking fields
      completion_date,
      time_taken_hours,
      defects_raised,
      defect_details,
      completion_notes,
      defects, // Defects array
    } = req.body;

    const releases = await readReleases();
    const newId = Math.max(...releases.map((r) => r.id), 0) + 1;

    const newRelease = {
      id: newId,
      account_name,
      release_date,
      executor,
      status: status || "Scheduled",
      notes: notes || "",
      release_version: release_version || "",
      product: product || "", // Add product field
      environment: environment || "", // Add environment field
      // Completion fields
      completion_date: completion_date || null,
      time_taken_hours: time_taken_hours || null,
      defects_raised: defects_raised || "0",
      defect_details: defect_details || "",
      completion_notes: completion_notes || "",
      defects: defects || [], // Store defects array
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    releases.push(newRelease);
    await writeReleases(releases);
    res.json(newRelease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the PUT /api/releases/:id endpoint
app.put("/api/releases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      account_name,
      release_date,
      executor,
      status,
      notes,
      release_version,
      product, // Add product field
      environment, // Add environment field
      // Completion tracking fields
      completion_date,
      time_taken_hours,
      defects_raised,
      defect_details,
      completion_notes,
      defects, // Defects array
    } = req.body;

    const releases = await readReleases();
    const index = releases.findIndex((r) => r.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: "Release not found" });
    }

    releases[index] = {
      ...releases[index],
      account_name,
      release_date,
      executor,
      status,
      notes: notes || "",
      release_version: release_version || "",
      product: product || "", // Add product field
      environment: environment || "", // Add environment field
      // Update completion fields
      completion_date: completion_date || null,
      time_taken_hours: time_taken_hours || null,
      defects_raised: defects_raised || "0",
      defect_details: defect_details || "",
      completion_notes: completion_notes || "",
      defects: defects || [], // Update defects array
      updated_at: new Date().toISOString(),
    };

    await writeReleases(releases);
    res.json({
      message: "Release updated successfully",
      release: releases[index],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete release
app.delete("/api/releases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const releases = await readReleases();
    const filteredReleases = releases.filter((r) => r.id !== parseInt(id));
    await writeReleases(filteredReleases);
    res.json({ message: "Release deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get release statistics - UPDATED to include features count
app.get("/api/stats", async (req, res) => {
  try {
    const releases = await readReleases();
    const accounts = await readAccounts();
    const availableReleases = await readAvailableReleases();

    const stats = {
      totalAccounts: accounts.length,
      totalReleases: releases.length,
      totalRegions: availableReleases.length,
      totalFeatures: availableReleases.reduce(
        (sum, region) => sum + (region.features?.length || 0),
        0
      ), // Added features count
      statusCounts: releases.reduce((acc, release) => {
        acc[release.status] = (acc[release.status] || 0) + 1;
        return acc;
      }, {}),
      releaseVersionCounts: releases.reduce((acc, release) => {
        if (release.release_version) {
          acc[release.release_version] =
            (acc[release.release_version] || 0) + 1;
        }
        return acc;
      }, {}),
      regionCounts: accounts.reduce((acc, account) => {
        if (account.region) {
          acc[account.region] = (acc[account.region] || 0) + 1;
        }
        return acc;
      }, {}),
      upcomingReleases: releases.filter(
        (r) =>
          new Date(r.release_date) >= new Date() && r.status === "Scheduled"
      ).length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Email sending endpoint with CC/BCC support and automatic template selection
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, releaseId, releaseData } = req.body;

    // Validate input
    if (!to || !subject) {
      return res.status(400).json({
        error: "Missing required email fields",
        required: ["to", "subject"],
        optional: ["cc", "bcc", "body", "releaseId", "releaseData"],
      });
    }

    // Helper function to parse recipients
    const parseRecipients = (recipients) => {
      if (!recipients) return [];
      if (typeof recipients === "string") {
        return recipients
          .split(/[,;\n]/)
          .map((email) => email.trim())
          .filter((email) => email.length > 0);
      } else if (Array.isArray(recipients)) {
        return recipients;
      }
      return [];
    };

    // Parse all recipient types
    const toRecipients = parseRecipients(to);
    const ccRecipients = parseRecipients(cc);
    const bccRecipients = parseRecipients(bcc);

    if (toRecipients.length === 0) {
      return res.status(400).json({
        error: "At least one TO recipient is required",
      });
    }

    // Determine if we should use the release template
    const useReleaseTemplate = releaseData && releaseData.release_version;

    // If no body is provided and we have release data, we'll use the template
    const emailBody =
      body ||
      (useReleaseTemplate
        ? "Release notification details are provided in the formatted email below."
        : "");

    if (!emailBody && !useReleaseTemplate) {
      return res.status(400).json({
        error: "Either 'body' or 'releaseData' must be provided",
      });
    }

    console.log(`Processing email request:`);
    console.log(`TO: ${toRecipients.length} recipients`);
    console.log(`CC: ${ccRecipients.length} recipients`);
    console.log(`BCC: ${bccRecipients.length} recipients`);
    console.log(
      `Template: ${useReleaseTemplate ? "Release Template" : "Plain Text"}`
    );

    if (useReleaseTemplate) {
      console.log(`Release Version: ${releaseData.release_version}`);
      console.log(`Account: ${releaseData.account_name}`);
      console.log(`Status: ${releaseData.status}`);
    }

    // Send email - if releaseData is provided, it will automatically use the HTML template
    const result = await sendEmail(
      toRecipients,
      subject,
      emailBody,
      releaseId,
      ccRecipients,
      bccRecipients,
      useReleaseTemplate ? releaseData : null // This triggers the HTML template
    );

    // Log the email activity
    const emailLog = {
      timestamp: new Date().toISOString(),
      recipients: result.recipients,
      recipientCount: result.recipientCount,
      subject: subject,
      releaseId: releaseId,
      template: useReleaseTemplate ? "Release HTML Template" : "Simple HTML",
      status: "sent",
      method: "nodemailer-smtp-with-template",
      smtpServer: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      messageId: result.messageId,
      platform: process.platform,
      releaseVersion: useReleaseTemplate ? releaseData.release_version : null,
    };

    console.log("Email log:", emailLog);

    res.json({
      success: true,
      message: `Email sent successfully to ${result.recipientCount.total} total recipients (${result.recipientCount.to} TO, ${result.recipientCount.cc} CC, ${result.recipientCount.bcc} BCC)`,
      emailLog: emailLog,
      messageId: result.messageId,
      recipients: result.recipients,
      recipientCount: result.recipientCount,
      templateUsed: useReleaseTemplate
        ? "Release HTML Template"
        : "Simple HTML",
    });
  } catch (error) {
    console.error("❌ Error sending email:", error);

    // Handle specific SMTP errors
    let errorMessage = "Failed to send email";
    let statusCode = 500;

    if (error.message.includes("Email validation failed")) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (
      error.message.includes("Total recipients") &&
      error.message.includes("exceeds maximum")
    ) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage =
        "Cannot connect to SMTP server umg.corp.amdocs.com:25. Please check network connectivity.";
      statusCode = 503;
    } else if (error.code === "ETIMEDOUT") {
      errorMessage =
        "SMTP connection timed out. Please check network connectivity.";
      statusCode = 504;
    } else if (error.code === "ENOTFOUND") {
      errorMessage =
        "SMTP server umg.corp.amdocs.com not found. Please check DNS resolution.";
      statusCode = 503;
    } else if (error.responseCode >= 500) {
      errorMessage = "SMTP server error. Please try again later.";
      statusCode = 502;
    } else if (error.responseCode >= 400) {
      errorMessage =
        "Email rejected by server. Please check recipient addresses.";
      statusCode = 400;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      code: error.code,
      responseCode: error.responseCode,
    });
  }
});

// Updated test email endpoint with CC/BCC support
app.post("/api/email/test", async (req, res) => {
  try {
    const { to, cc, bcc } = req.body;

    if (!to) {
      return res.status(400).json({
        error: "TO recipient email address(es) required",
        example: {
          to: "user@amdocs.com",
          cc: "manager@amdocs.com",
          bcc: "admin@amdocs.com",
          multiple: {
            to: ["user1@amdocs.com", "user2@amdocs.com"],
            cc: ["manager1@amdocs.com", "manager2@amdocs.com"],
            bcc: "admin@amdocs.com",
          },
        },
      });
    }

    // Parse recipients
    const parseRecipients = (recipients) => {
      if (!recipients) return [];
      if (typeof recipients === "string") {
        return recipients
          .split(/[,;\n]/)
          .map((email) => email.trim())
          .filter((email) => email.length > 0);
      } else if (Array.isArray(recipients)) {
        return recipients;
      }
      return [];
    };

    const toRecipients = parseRecipients(to);
    const ccRecipients = parseRecipients(cc);
    const bccRecipients = parseRecipients(bcc);

    const testSubject = "Test Email with CC/BCC from Release Management System";
    const testBody = `This is a test email sent at ${new Date().toLocaleString()}.

If you received this email, the email configuration with CC/BCC is working correctly.

Recipient Information:
=====================
- TO Recipients: ${toRecipients.length}
- CC Recipients: ${ccRecipients.length}
- BCC Recipients: ${bccRecipients.length}
- Total Recipients: ${
      toRecipients.length + ccRecipients.length + bccRecipients.length
    }

System Information:
==================
- Platform: ${process.platform}
- Node.js Version: ${process.version}
- SMTP Server: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}
- Authentication: Not required
- SSL/TLS: Disabled
- From Email: ${EMAIL_SETTINGS.fromEmail}

Email Settings:
===============
- Maximum Recipients: ${EMAIL_SETTINGS.maxRecipients}
- Allowed Domains: ${EMAIL_SETTINGS.allowedDomains.join(", ")}

Best regards,
Release Management System`;

    const result = await sendEmail(
      toRecipients,
      testSubject,
      testBody,
      "test",
      ccRecipients,
      bccRecipients
    );

    res.json({
      success: true,
      message: `Test email sent successfully to ${result.recipientCount.total} total recipients`,
      messageId: result.messageId,
      recipients: result.recipients,
      recipientCount: result.recipientCount,
    });
  } catch (error) {
    res.status(500).json({
      error: "Test email failed",
      details: error.message,
    });
  }
});

// The "catchall" handler: send back React's index.html file for any non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// Initialize data on startup
initializeData()
  .then(() => {
    // Call migration on server start
    migrateReleases();
    app.listen(PORT, () => {
      console.log(`🚀 Release Planning Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`📁 Data stored in: ${DATA_DIR}`);
      console.log(`🌐 Frontend build path: ${buildPath}`);

      // Check if build directory exists
      const fs = require("fs");
      if (fs.existsSync(buildPath)) {
        console.log(`✅ Build directory found`);
        if (fs.existsSync(path.join(buildPath, "index.html"))) {
          console.log(`✅ index.html found`);
        } else {
          console.log(`❌ index.html NOT found`);
        }
      } else {
        console.log(`❌ Build directory NOT found at: ${buildPath}`);
      }
    });
  })
  .catch((err) => {
    console.error("Failed to initialize data:", err);
    process.exit(1);
  });
