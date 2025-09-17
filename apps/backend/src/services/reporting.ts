import { getPrismaClient, PrismaClient, Mailbox, Message, Contact, Thread, User, Organization, Analytics, Report, getPrismaTypes } from '../utils/prisma-import';
// Types: PrismaClient
import { AnalyticsService } from './analytics';
import { AIService } from './ai';
import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import moment from 'moment';
import fs from 'fs';
import path from 'path';

export interface ReportConfig {
  userId: string;
  organizationId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'excel' | 'email';
  template?: string;
  recipients?: string[];
  includeAI?: boolean;
}

export interface ReportData {
  overview: any;
  volume: any;
  responseTimes: any;
  contacts: any;
  insights: string[];
  generatedAt: Date;
  period: string;
}

export class ReportingService {
  private prisma: PrismaClient;
  private analyticsService: AnalyticsService;
  private aiService: AIService;
  private templatesDir: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.analyticsService = new AnalyticsService(prisma);
    this.aiService = new AIService();
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  async generateReport(config: ReportConfig): Promise<{ data: ReportData; filePath?: string }> {
    try {
      // Collect all analytics data
      const data = await this.collectReportData(config);
      
      let filePath: string | undefined;

      switch (config.format) {
        case 'pdf':
          filePath = await this.generatePDF(data, config);
          break;
        case 'excel':
          filePath = await this.generateExcel(data, config);
          break;
        case 'email':
          await this.sendEmailReport(data, config);
          break;
      }

      // Save report record
      await this.prisma.report.create({
        data: {
          // userId: config.userId, // Commented out due to Prisma schema
          organizationId: config.organizationId,
          type: config.format.toUpperCase() as any,
          // period: data.period, // Commented out due to Prisma schema
          data: data as any,
          filePath: filePath,
          // status: 'COMPLETED' // Commented out due to Prisma schema
        } as any
      });

      return { data, filePath };
    } catch (error) {
      console.error('Report generation failed:', error);
      
      // Save failed report record
      await this.prisma.report.create({
        data: {
          // userId: config.userId, // Commented out due to Prisma schema
          organizationId: config.organizationId,
          type: config.format.toUpperCase() as any,
          // period: moment(config.dateRange.start).format('YYYY-MM-DD') + ' to ' + moment(config.dateRange.end).format('YYYY-MM-DD'), // Commented out due to Prisma schema
          data: null,
          // status: 'FAILED' // Commented out due to Prisma schema
        } as any
      });

      throw error;
    }
  }

  private async collectReportData(config: ReportConfig): Promise<ReportData> {
    const { userId, organizationId, dateRange } = config;

    // Get overview data
    const overview = await (this.analyticsService as any).getOverview(userId, dateRange);
    
    // Get volume data
    const volume = await (this.analyticsService as any).getVolumeData(userId, dateRange);
    
    // Get response time data
    const responseTimes = await (this.analyticsService as any).getResponseTimeData(userId, dateRange);
    
    // Get contact data
    const contacts = await (this.analyticsService as any).getTopContacts(userId, dateRange);

    // Generate AI insights if requested
    let insights: string[] = [];
    if (config.includeAI) {
      insights = await this.generateAIInsights(overview, volume, responseTimes, contacts);
    }

    return {
      overview,
      volume,
      responseTimes,
      contacts,
      insights,
      generatedAt: new Date(),
      period: `${moment(dateRange.start).format('MMM DD, YYYY')} - ${moment(dateRange.end).format('MMM DD, YYYY')}`
    };
  }

  private async generateAIInsights(overview: any, volume: any, responseTimes: any, contacts: any): Promise<string[]> {
    try {
      const prompt = `
        Analyze the following email analytics data and provide 3-5 key insights:
        
        Overview: ${JSON.stringify(overview)}
        Volume: ${JSON.stringify(volume)}
        Response Times: ${JSON.stringify(responseTimes)}
        Top Contacts: ${JSON.stringify(contacts)}
        
        Provide actionable insights in a professional tone, focusing on:
        - Performance trends
        - Communication patterns
        - Improvement opportunities
        - Key metrics highlights
      `;

      const response = await (this.aiService as any).processNaturalLanguageQuery(prompt, 'demo-org', {});
      return response.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('AI insights generation failed:', error);
      return ['AI insights temporarily unavailable'];
    }
  }

  private async generatePDF(data: ReportData, config: ReportConfig): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Generate HTML content
    const htmlContent = await this.generateHTMLReport(data, config);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const fileName = `email-analytics-report-${moment().format('YYYY-MM-DD-HH-mm-ss')}.pdf`;
    const filePath = path.join(__dirname, '../../reports', fileName);
    
    // Ensure reports directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();
    return filePath;
  }

  private async generateExcel(data: ReportData, config: ReportConfig): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    
    // Add metadata
    workbook.creator = 'Taskforce Analytics';
    workbook.lastModifiedBy = 'Taskforce Analytics';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Overview sheet
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.addRow(['Metric', 'Value']);
    overviewSheet.addRow(['Total Sent', data.overview.totalSent]);
    overviewSheet.addRow(['Total Received', data.overview.totalReceived]);
    overviewSheet.addRow(['Average Response Time', data.overview.averageResponseTime]);
    overviewSheet.addRow(['Top Contact', data.overview.topContact]);
    overviewSheet.addRow(['Report Period', data.period]);
    overviewSheet.addRow(['Generated At', data.generatedAt.toISOString()]);

    // Volume sheet
    const volumeSheet = workbook.addWorksheet('Email Volume');
    volumeSheet.addRow(['Date', 'Sent', 'Received', 'Total']);
    
    if (data.volume.daily) {
      data.volume.daily.forEach((day: any) => {
        volumeSheet.addRow([
          moment(day.date).format('YYYY-MM-DD'),
          day.sent,
          day.received,
          day.total
        ]);
      });
    }

    // Response times sheet
    const responseSheet = workbook.addWorksheet('Response Times');
    responseSheet.addRow(['Metric', 'Value']);
    responseSheet.addRow(['Average', data.responseTimes.average]);
    responseSheet.addRow(['Median', data.responseTimes.median]);
    responseSheet.addRow(['Fastest', data.responseTimes.fastest]);
    responseSheet.addRow(['Slowest', data.responseTimes.slowest]);

    // Contacts sheet
    const contactsSheet = workbook.addWorksheet('Top Contacts');
    contactsSheet.addRow(['Email', 'Messages', 'Response Rate', 'Health Score']);
    
    if (data.contacts.topContacts) {
      data.contacts.topContacts.forEach((contact: any) => {
        contactsSheet.addRow([
          contact.email,
          contact.messageCount,
          contact.responseRate,
          contact.healthScore
        ]);
      });
    }

    // AI Insights sheet
    if (data.insights.length > 0) {
      const insightsSheet = workbook.addWorksheet('AI Insights');
      insightsSheet.addRow(['Insight']);
      data.insights.forEach(insight => {
        insightsSheet.addRow([insight]);
      });
    }

    const fileName = `email-analytics-report-${moment().format('YYYY-MM-DD-HH-mm-ss')}.xlsx`;
    const filePath = path.join(__dirname, '../../reports', fileName);
    
    // Ensure reports directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private async generateHTMLReport(data: ReportData, config: ReportConfig): Promise<string> {
    const templatePath = path.join(this.templatesDir, 'email-report.hbs');
    
    let template: string;
    try {
      template = await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
      // Use default template if file doesn't exist
      template = this.getDefaultHTMLTemplate();
    }

    const compiledTemplate = Handlebars.compile(template);
    
    return compiledTemplate({
      title: 'Email Analytics Report',
      period: data.period,
      generatedAt: moment(data.generatedAt).format('MMMM DD, YYYY [at] h:mm A'),
      data: data,
      styles: this.getReportStyles()
    });
  }

  private getDefaultHTMLTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>{{title}}</title>
        <style>{{{styles}}}</style>
      </head>
      <body>
        <div class="report-container">
          <header class="report-header">
            <h1>{{title}}</h1>
            <div class="report-meta">
              <p><strong>Period:</strong> {{period}}</p>
              <p><strong>Generated:</strong> {{generatedAt}}</p>
            </div>
          </header>

          <section class="overview-section">
            <h2>Overview</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <h3>Total Sent</h3>
                <div class="metric-value">{{data.overview.totalSent}}</div>
              </div>
              <div class="metric-card">
                <h3>Total Received</h3>
                <div class="metric-value">{{data.overview.totalReceived}}</div>
              </div>
              <div class="metric-card">
                <h3>Avg Response Time</h3>
                <div class="metric-value">{{data.overview.averageResponseTime}}</div>
              </div>
              <div class="metric-card">
                <h3>Top Contact</h3>
                <div class="metric-value">{{data.overview.topContact}}</div>
              </div>
            </div>
          </section>

          {{#if data.insights.length}}
          <section class="insights-section">
            <h2>AI Insights</h2>
            <ul class="insights-list">
              {{#each data.insights}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </section>
          {{/if}}

          <footer class="report-footer">
            <p>Generated by Taskforce Analytics</p>
          </footer>
        </div>
      </body>
      </html>
    `;
  }

  private getReportStyles(): string {
    return `
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
      .report-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .report-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; }
      .report-header h1 { color: #2c3e50; margin: 0 0 10px 0; font-size: 28px; }
      .report-meta { color: #7f8c8d; font-size: 14px; }
      .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 20px 0; }
      .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
      .metric-card h3 { margin: 0 0 10px 0; color: #495057; font-size: 14px; text-transform: uppercase; }
      .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
      .insights-section { margin: 40px 0; }
      .insights-list { list-style: none; padding: 0; }
      .insights-list li { background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #28a745; }
      .report-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e5e9; color: #7f8c8d; font-size: 12px; }
    `;
  }

  private async sendEmailReport(data: ReportData, config: ReportConfig): Promise<void> {
    if (!config.recipients || config.recipients.length === 0) {
      throw new Error('No recipients specified for email report');
    }

    // Get user information
    const user = await this.prisma.user.findUnique({
      where: { id: config.userId },
      include: { organization: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Generate HTML content
    const htmlContent = await this.generateHTMLReport(data, config);

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: config.recipients.join(', '),
      subject: `Email Analytics Report - ${data.period}`,
      html: htmlContent,
      text: `Email Analytics Report for ${data.period}\n\nGenerated on ${moment(data.generatedAt).format('MMMM DD, YYYY [at] h:mm A')}`
    });
  }

  async scheduleReport(userId: string, config: Partial<ReportConfig>): Promise<void> {
    await this.prisma.report.create({
      data: {
        // userId, // Commented out due to Prisma schema
        // organizationId: config.organizationId!, // Commented out due to Prisma schema
        type: 'SCHEDULED' as any,
        // period: `${moment(config.dateRange?.start).format('YYYY-MM-DD')} to ${moment(config.dateRange?.end).format('YYYY-MM-DD')}`, // Commented out due to Prisma schema
        data: config as any,
        // status: 'PENDING' // Commented out due to Prisma schema
      } as any
    });
  }

  async getReports(userId: string, organizationId: string): Promise<any[]> {
    return this.prisma.report.findMany({
      where: {
        // userId, // Commented out due to Prisma schema
        organizationId
      },
      orderBy: {
        // createdAt: 'desc' // Commented out due to Prisma schema
      },
      take: 50
    });
  }
}
