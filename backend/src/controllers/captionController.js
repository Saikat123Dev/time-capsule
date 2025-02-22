const AssemblyAI = require('assemblyai');
const prisma = require('../config/database');
const env = require('../config/env');

class CaptionController {
  static async generateCaptions(req, res) {
    try {


      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const audioFile = req.file;
      console.log(audioFile);


      const client = new AssemblyAI.AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY,
      });
     console.log(client);

      // Upload audio file
      const audioUrl = await client.files.upload(audioFile.buffer);
      console.log(audioUrl);
      // Request transcription
      const transcript = await client.transcripts.create({
        audio_url: audioUrl,
        speaker_labels: true,
        language_detection: true,
        sentiment_analysis: false,
        entity_detection: false,
      });

      // Polling for completion
      let transcriptResult;
      do {
        transcriptResult = await client.transcripts.get(transcript.id);
        if (transcriptResult.status === 'error') {
          throw new Error('Transcription failed');
        }
        if (transcriptResult.status !== 'completed') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } while (transcriptResult.status !== 'completed');

      const captions = transcriptResult.words;

      // Store captions in database
      // const captionRecord = await prisma.capsule.update({
      //   where: { id: req.body.capsuleId },
      //   data: {
      //     description: captions,
      //   },
      // });

      res.status(200).json({
        message: 'Captions generated successfully',
        captions,
        transcriptId: transcriptResult.id,
        audioUrl,
      });
    } catch (error) {
      console.error('Error generating captions:', error);
      res.status(500).json({ error: error.message || 'Failed to generate captions' });
    }
  }
}

module.exports = CaptionController;
