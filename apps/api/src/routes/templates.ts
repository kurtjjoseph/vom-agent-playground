import { Router } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../lib/logger';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();
const logger = createLogger('templates-routes');

const BUILT_IN_TEMPLATES = [
  {
    id: 'slack-responder',
    archetype: 'SLACK_RESPONDER',
    name: 'Slack Responder',
    description: 'Automatically respond to Slack messages with AI-generated replies',
    systemPrompt: 'You are a helpful Slack bot. Respond to messages in a professional and friendly manner.',
    configTemplate: {
      slackBotToken: '',
      slackChannels: [],
      responseDelay: 1000,
    },
  },
  {
    id: 'gdrive-scanner',
    archetype: 'GOOGLE_DRIVE_SCANNER',
    name: 'Google Drive Scanner',
    description: 'Scan Google Drive for files and analyze their contents',
    systemPrompt: 'You are a document analysis expert. Examine and summarize files from Google Drive.',
    configTemplate: {
      googleServiceAccount: '',
      folderId: '',
      fileTypes: ['pdf', 'docx', 'txt'],
      scanInterval: 3600,
    },
  },
  {
    id: 'webhook-listener',
    archetype: 'WEBHOOK_LISTENER',
    name: 'Webhook Listener',
    description: 'Listen to incoming webhooks and process them with AI',
    systemPrompt: 'You are a webhook processor. Analyze incoming webhook data and respond appropriately.',
    configTemplate: {
      webhookPath: '/webhook',
      expectedEvents: [],
    },
  },
  {
    id: 'email-processor',
    archetype: 'EMAIL_PROCESSOR',
    name: 'Email Processor',
    description: 'Process incoming emails and generate intelligent responses',
    systemPrompt: 'You are an email assistant. Read incoming emails and draft professional responses.',
    configTemplate: {
      emailProvider: 'gmail',
      inboxLabel: 'INBOX',
      autoRespond: false,
    },
  },
  {
    id: 'data-analyst',
    archetype: 'DATA_ANALYST',
    name: 'Data Analyst',
    description: 'Analyze data and generate insights using AI',
    systemPrompt: 'You are a data analyst. Examine datasets and provide meaningful insights and trends.',
    configTemplate: {
      dataSource: 'csv',
      analysisType: 'summary',
    },
  },
];

// List all templates
router.get('/', async (req: AuthRequest, res) => {
  try {
    res.json(BUILT_IN_TEMPLATES);
  } catch (error) {
    logger.error('List templates error:', error);
    throw error;
  }
});

// Get template by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const template = BUILT_IN_TEMPLATES.find((t) => t.id === id);

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    res.json(template);
  } catch (error) {
    logger.error('Get template error:', error);
    throw error;
  }
});

export default router;
