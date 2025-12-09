import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("Please set GOOGLE_API_KEY or GEMINI_API_KEY in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

const OUTPUT_DIR = path.join(__dirname, "../../client/android/playstore-assets");
const REFERENCE_DIR = path.join(__dirname, "../../web/images");
const ANDROID_RES_DIR = path.join(__dirname, "../../client/android/app/src/main/res");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Android icon sizes for mipmap directories
const ICON_SIZES = [
  { name: "mipmap-mdpi", size: 48 },
  { name: "mipmap-hdpi", size: 72 },
  { name: "mipmap-xhdpi", size: 96 },
  { name: "mipmap-xxhdpi", size: 144 },
  { name: "mipmap-xxxhdpi", size: 192 },
];

interface ImageGenConfig {
  prompt: string;
  aspectRatio: string;
  outputName: string;
  referenceImage?: string;
}

async function generateImage(
  config: ImageGenConfig,
  retries = 3
): Promise<boolean> {
  console.log(`\nGenerating ${config.outputName}...`);
  const outputPath = path.join(OUTPUT_DIR, config.outputName);

  for (let i = 0; i < retries; i++) {
    try {
      const contents: any[] = [{ text: config.prompt }];

      // Add reference image if provided
      if (config.referenceImage) {
        const refPath = path.join(REFERENCE_DIR, config.referenceImage);
        if (fs.existsSync(refPath)) {
          const refBuffer = fs.readFileSync(refPath);
          const ext = path.extname(config.referenceImage).toLowerCase();
          const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
          contents.push({
            inlineData: {
              mimeType,
              data: refBuffer.toString("base64"),
            },
          });
          console.log(`  Using reference: ${config.referenceImage}`);
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: contents,
        config: {
          responseModalities: ["IMAGE"],
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && (part as any).inlineData) {
        const buffer = Buffer.from((part as any).inlineData.data, "base64");
        fs.writeFileSync(outputPath, buffer);
        console.log(`  ✓ Saved: ${outputPath}`);
        return true;
      } else {
        console.error("  ✗ No image generated", JSON.stringify(response));
      }
      break;
    } catch (error: any) {
      console.error(`  ✗ Error (attempt ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        console.log("  Retrying in 5 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
  return false;
}

async function resizeAndCopyIcons(iconPath: string) {
  console.log("\n--- Resizing and Copying App Icons ---");

  if (!fs.existsSync(iconPath)) {
    console.log(`  ✗ Icon not found: ${iconPath}`);
    return;
  }

  for (const { name, size } of ICON_SIZES) {
    const mipmapDir = path.join(ANDROID_RES_DIR, name);
    if (!fs.existsSync(mipmapDir)) {
      fs.mkdirSync(mipmapDir, { recursive: true });
    }

    const outputPath = path.join(mipmapDir, "ic_launcher.png");
    const outputRoundPath = path.join(mipmapDir, "ic_launcher_round.png");
    const foregroundPath = path.join(mipmapDir, "ic_launcher_foreground.png");

    try {
      // Create square icon
      await sharp(iconPath)
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(outputPath);
      console.log(`  ✓ Created ${name}/ic_launcher.png (${size}x${size})`);

      // Create round icon (same image, Android handles the mask)
      await sharp(iconPath)
        .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(outputRoundPath);
      console.log(`  ✓ Created ${name}/ic_launcher_round.png (${size}x${size})`);

      // Create foreground for adaptive icon (larger with padding)
      const foregroundSize = Math.round(size * 1.5);
      await sharp(iconPath)
        .resize(Math.round(size * 0.7), Math.round(size * 0.7), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({
          top: Math.round(size * 0.4),
          bottom: Math.round(size * 0.4),
          left: Math.round(size * 0.4),
          right: Math.round(size * 0.4),
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .resize(foregroundSize, foregroundSize)
        .png()
        .toFile(foregroundPath);
      console.log(`  ✓ Created ${name}/ic_launcher_foreground.png (${foregroundSize}x${foregroundSize})`);
    } catch (error: any) {
      console.error(`  ✗ Error creating ${name} icons:`, error.message);
    }
  }
}

async function createPlayStoreIcon(iconPath: string) {
  console.log("\n--- Creating Play Store Icon (512x512) ---");
  
  const outputPath = path.join(OUTPUT_DIR, "play-store-icon-512.png");
  
  try {
    await sharp(iconPath)
      .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`  ✓ Created play-store-icon-512.png`);
  } catch (error: any) {
    console.error(`  ✗ Error:`, error.message);
  }
}

async function createFeatureGraphic(imagePath: string) {
  console.log("\n--- Creating Feature Graphic (1024x500) ---");
  
  const outputPath = path.join(OUTPUT_DIR, "feature-graphic-1024x500.png");
  
  try {
    await sharp(imagePath)
      .resize(1024, 500, { fit: "cover", position: "center" })
      .png()
      .toFile(outputPath);
    console.log(`  ✓ Created feature-graphic-1024x500.png`);
  } catch (error: any) {
    console.error(`  ✗ Error:`, error.message);
  }
}

async function copyAndPrepareIcons() {
  console.log("\n--- Preparing Reference Icons ---");
  
  // Copy the team_tamo.png as the base for the icon (it has transparent background)
  const teamTamoPath = path.join(REFERENCE_DIR, "team_tamo.png");
  const logoPath = path.join(REFERENCE_DIR, "logo.png");
  
  if (fs.existsSync(teamTamoPath)) {
    // Copy as icon foreground reference
    fs.copyFileSync(teamTamoPath, path.join(OUTPUT_DIR, "icon-foreground-reference.png"));
    console.log("  ✓ Copied team_tamo.png as icon foreground reference");
  }
  
  if (fs.existsSync(logoPath)) {
    fs.copyFileSync(logoPath, path.join(OUTPUT_DIR, "logo-reference.png"));
    console.log("  ✓ Copied logo.png as logo reference");
  }
}

async function main() {
  console.log("===========================================");
  console.log("  TamaPets Play Store Asset Generator");
  console.log("===========================================");
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  console.log(`Reference directory: ${REFERENCE_DIR}`);

  // Check for reference images
  const bannerPath = path.join(REFERENCE_DIR, "banner.jpg");
  const tamapetsPath = path.join(REFERENCE_DIR, "tamapets.jpeg");
  const teamTamoPath = path.join(REFERENCE_DIR, "team_tamo.png");
  const logoPath = path.join(REFERENCE_DIR, "logo.png");

  console.log("\nReference images found:");
  console.log(`  banner.jpg: ${fs.existsSync(bannerPath) ? "✓" : "✗"}`);
  console.log(`  tamapets.jpeg: ${fs.existsSync(tamapetsPath) ? "✓" : "✗"}`);
  console.log(`  team_tamo.png: ${fs.existsSync(teamTamoPath) ? "✓" : "✗"}`);
  console.log(`  logo.png: ${fs.existsSync(logoPath) ? "✓" : "✗"}`);

  // Copy reference images first
  await copyAndPrepareIcons();

  const args = process.argv.slice(2);
  const skipGeneration = args.includes("--skip-generation");
  const useExisting = args.includes("--use-existing");

  if (useExisting) {
    // Use existing images without AI generation
    console.log("\n--- Using existing images (no AI generation) ---");
    
    // Use team_tamo.png for app icon
    if (fs.existsSync(teamTamoPath)) {
      await createPlayStoreIcon(teamTamoPath);
      await resizeAndCopyIcons(teamTamoPath);
    }
    
    // Use tamapets.jpeg or banner.jpg for feature graphic
    const featureSource = fs.existsSync(tamapetsPath) ? tamapetsPath : bannerPath;
    if (fs.existsSync(featureSource)) {
      await createFeatureGraphic(featureSource);
    }
  } else if (!skipGeneration) {
    // Generate new images with AI
    const assets: ImageGenConfig[] = [
      {
        prompt: `Create a Google Play Store app icon (512x512) for "TamaPets" - a virtual pet game.
          Use these cute animal characters as reference - keep the same kawaii art style with round shapes, simple features, and warm colors.
          The icon should show 1-2 of the cute pet characters prominently.
          Make it colorful, appealing, and suitable for all ages.
          The background should be a solid vibrant color or simple gradient.
          Do NOT include any text, logos, or words in the icon.
          The style should be vector-like, clean, and modern.`,
        aspectRatio: "1:1",
        outputName: "app-icon-generated-512.png",
        referenceImage: "team_tamo.png",
      },
      {
        prompt: `Create a Google Play Store feature graphic (1024x500 landscape banner) for "TamaPets" - a virtual pet game.
          Use these cute animal characters as reference - keep the same kawaii art style.
          Show multiple cute pet characters in a cheerful, colorful scene.
          The banner should be vibrant, eye-catching, and fun.
          Include a nice background scene (meadow, sky, or playful environment).
          Leave some space on the left or center for potential text overlay.
          Do NOT include any text, titles, or words - just the artwork.
          Style: Vector art, kawaii, colorful, child-friendly.`,
        aspectRatio: "16:9",
        outputName: "feature-graphic-generated.png",
        referenceImage: "tamapets.jpeg",
      },
    ];

    let successCount = 0;
    for (const asset of assets) {
      const success = await generateImage(asset);
      if (success) successCount++;
      // Wait between API calls
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\n  AI Generation: ${successCount}/${assets.length} assets`);

    // Also create resized versions from generated icon if it exists
    const generatedIconPath = path.join(OUTPUT_DIR, "app-icon-generated-512.png");
    if (fs.existsSync(generatedIconPath)) {
      await resizeAndCopyIcons(generatedIconPath);
    } else if (fs.existsSync(teamTamoPath)) {
      // Fallback to team_tamo.png
      console.log("\n  Using team_tamo.png as fallback for icons...");
      await resizeAndCopyIcons(teamTamoPath);
      await createPlayStoreIcon(teamTamoPath);
    }
  }

  console.log("\n===========================================");
  console.log("  Asset Generation Complete!");
  console.log("===========================================");

  console.log("\n📋 Generated Assets:");
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    files.forEach(f => console.log(`  - ${f}`));
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Review generated images in:", OUTPUT_DIR);
  console.log("2. Icons have been copied to android/app/src/main/res/mipmap-* folders");
  console.log("3. Upload feature-graphic-1024x500.png to Play Console");
  console.log("4. Upload play-store-icon-512.png to Play Console");
}

main().catch(console.error);

