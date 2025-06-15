import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import Sleep from '../../../../models/Sleep';
import { connectToDatabase } from '../../../../lib/mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as unzipper from 'unzipper';
import * as xml2js from 'xml2js';

// Define interfaces
interface SleepSegment {
  startTime: Date;
  endTime: Date;
  value: string;
  source: string;
}

// Helper to determine sleep quality based on sleep phases
function estimateSleepQuality(
  sleepValue: string,
  durationHours: number
): number {
  // Default medium quality
  let quality = 3;

  // If we have deep sleep or REM, likely better quality
  if (sleepValue === 'HKCategoryValueSleepAnalysisAsleepDeep') {
    quality = 5;
  } else if (sleepValue === 'HKCategoryValueSleepAnalysisAsleepREM') {
    quality = 4;
  } else if (sleepValue === 'HKCategoryValueSleepAnalysisAsleepCore') {
    quality = 3;
  }

  // Very short or very long sleep might affect quality
  if (durationHours < 4) {
    quality = Math.max(1, quality - 2); // Very short sleep tends to be poor quality
  } else if (durationHours < 6) {
    quality = Math.max(1, quality - 1); // Short sleep
  } else if (durationHours > 10) {
    quality = Math.max(1, quality - 1); // Excessive sleep often indicates poor quality
  }

  return quality;
}

export async function POST(req: Request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('healthData') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Please upload a .zip file from Apple Health' },
        { status: 400 }
      );
    }

    // Create temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-import-'));
    const zipPath = path.join(tempDir, 'export.zip');

    // Save the uploaded file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(zipPath, fileBuffer);

    try {
      // Extract the zip file
      await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .promise();

      // Check if the export file exists
      const xmlPath = path.join(tempDir, 'apple_health_export', 'export.xml');
      if (!fs.existsSync(xmlPath)) {
        throw new Error('Invalid Apple Health export format');
      }

      // Read the export.xml file
      const xmlData = fs.readFileSync(xmlPath, 'utf-8');

      // Parse XML
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);

      // Extract sleep records
      const sleepRecords = [];
      let importCount = 0;

      if (result.HealthData && result.HealthData.Record) {
        // We'll group sleep segments that are close together (same night)
        const sleepSegments: SleepSegment[] = [];

        for (const record of result.HealthData.Record) {
          const attributes = record.$;

          // Look for sleep analysis records
          if (attributes.type === 'HKCategoryTypeIdentifierSleepAnalysis') {
            // Only get asleep records (not in bed)
            if (attributes.value.includes('Asleep')) {
              sleepSegments.push({
                startTime: new Date(attributes.startDate),
                endTime: new Date(attributes.endDate),
                value: attributes.value,
                source: attributes.sourceName || 'Apple Health',
              });
            }
          }
        }

        // Sort segments by start time
        sleepSegments.sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime()
        );

        // Group segments into sleep sessions (if they're within 30 minutes of each other)
        const sleepSessions: SleepSegment[][] = [];
        let currentSession: SleepSegment[] = [];

        for (const segment of sleepSegments) {
          if (currentSession.length === 0) {
            currentSession.push(segment);
          } else {
            // Check if this segment is part of the current session
            const lastSegment = currentSession[currentSession.length - 1];
            const gapMinutes =
              (segment.startTime.getTime() - lastSegment.endTime.getTime()) /
              (1000 * 60);

            if (gapMinutes <= 30) {
              // Part of the same sleep session
              currentSession.push(segment);
            } else {
              // Start a new session
              sleepSessions.push([...currentSession]);
              currentSession = [segment];
            }
          }
        }

        // Add the last session if not empty
        if (currentSession.length > 0) {
          sleepSessions.push(currentSession);
        }

        // Process each sleep session
        for (const session of sleepSessions) {
          // Get the earliest start and latest end
          const startTime = session[0].startTime;
          const endTime = session[session.length - 1].endTime;

          // Calculate duration in hours
          const durationHours =
            (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

          // Skip very short sleep segments (less than 30 minutes)
          if (durationHours < 0.5) continue;

          // Check if this record already exists
          const existing = await Sleep.findOne({
            userId: authSession.user.id,
            startTime: { $eq: startTime },
            endTime: { $eq: endTime },
          });

          if (!existing) {
            // Estimate sleep quality based on the session
            // Get the "best" sleep type in the session
            let bestSleepValue = '';
            if (
              session.some(
                (s) => s.value === 'HKCategoryValueSleepAnalysisAsleepDeep'
              )
            ) {
              bestSleepValue = 'HKCategoryValueSleepAnalysisAsleepDeep';
            } else if (
              session.some(
                (s) => s.value === 'HKCategoryValueSleepAnalysisAsleepREM'
              )
            ) {
              bestSleepValue = 'HKCategoryValueSleepAnalysisAsleepREM';
            } else if (
              session.some(
                (s) => s.value === 'HKCategoryValueSleepAnalysisAsleepCore'
              )
            ) {
              bestSleepValue = 'HKCategoryValueSleepAnalysisAsleepCore';
            } else {
              bestSleepValue = 'HKCategoryValueSleepAnalysisAsleepUnspecified';
            }

            const quality = estimateSleepQuality(bestSleepValue, durationHours);

            // Create the sleep entry
            const sleepEntry = await Sleep.create({
              userId: authSession.user.id,
              startTime,
              endTime,
              quality,
              notes: `Imported from Apple Health (${session[0].source})`,
            });

            sleepRecords.push(sleepEntry);
            importCount++;
          }
        }
      }

      return NextResponse.json({
        message: 'Import successful',
        count: importCount,
      });
    } catch (error) {
      console.error('Error processing health data:', error);
      return NextResponse.json(
        {
          error:
            "Could not process the health data file. Please make sure it's a valid Apple Health export.",
        },
        { status: 400 }
      );
    } finally {
      // Clean up temp directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Error cleaning up temp files:', err);
      }
    }
  } catch (error) {
    console.error('Error importing health data:', error);
    return NextResponse.json(
      { error: 'Error processing health data' },
      { status: 500 }
    );
  }
}
