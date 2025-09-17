import { FastifyInstance } from 'fastify';
import { AutoSetupService } from '../services/auto-setup';

export async function autoSetupRoutes(fastify: FastifyInstance) {
  const autoSetupService = AutoSetupService.getInstance();

  // GET /api/v1/auto-setup/status
  fastify.get('/api/v1/auto-setup/status', async (request, reply) => {
    try {
      const status = await autoSetupService.checkSetupStatus();
      return {
        success: true,
        data: status
      };
    } catch (error: any) {
      console.error('Auto-setup status check failed:', error);
      reply.status(500);
      return {
        success: false,
        error: error.message || 'Failed to check setup status'
      };
    }
  });

  // POST /api/v1/auto-setup/supabase
  fastify.post('/api/v1/auto-setup/supabase', async (request, reply) => {
    try {
      const result = await autoSetupService.setupSupabaseDatabase();
      
      if (result.success) {
        return {
          success: true,
          data: result
        };
      } else {
        reply.status(400);
        return {
          success: false,
          error: result.message
        };
      }
    } catch (error: any) {
      console.error('Auto-setup Supabase failed:', error);
      reply.status(500);
      return {
        success: false,
        error: error.message || 'Failed to setup Supabase database'
      };
    }
  });

  // POST /api/v1/auto-setup/sample-data
  fastify.post('/api/v1/auto-setup/sample-data', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;

      const result = await autoSetupService.createSampleData(userId);
      
      if (result.success) {
        return {
          success: true,
          data: result
        };
      } else {
        reply.status(400);
        return {
          success: false,
          error: result.message
        };
      }
    } catch (error: any) {
      console.error('Sample data creation failed:', error);
      reply.status(500);
      return {
        success: false,
        error: error.message || 'Failed to create sample data'
      };
    }
  });

  // POST /api/v1/auto-setup/complete
  fastify.post('/api/v1/auto-setup/complete', async (request, reply) => {
    try {
      await request.jwtVerify();
      const { userId } = request.user as any;

      // Run complete setup
      const supabaseResult = await autoSetupService.setupSupabaseDatabase();
      
      if (!supabaseResult.success) {
        reply.status(400);
        return {
          success: false,
          error: `Database setup failed: ${supabaseResult.message}`
        };
      }

      // Create sample data
      const sampleResult = await autoSetupService.createSampleData(userId);
      
      return {
        success: true,
        data: {
          message: 'Complete setup finished successfully',
          database: supabaseResult,
          sampleData: sampleResult
        }
      };
    } catch (error: any) {
      console.error('Complete auto-setup failed:', error);
      reply.status(500);
      return {
        success: false,
        error: error.message || 'Failed to complete setup'
      };
    }
  });

  // GET /api/v1/auto-setup/test-connection
  fastify.get('/api/v1/auto-setup/test-connection', async (request, reply) => {
    try {
      const { supabaseAdmin } = require('../config/supabase');
      
      // Test basic connection
      const { data, error } = await supabaseAdmin
        .from('scheduled_emails')
        .select('count')
        .limit(1);

      if (error) {
        return {
          success: false,
          error: `Connection failed: ${error.message}`
        };
      }

      return {
        success: true,
        data: {
          message: 'Connection successful',
          status: 'connected'
        }
      };
    } catch (error: any) {
      console.error('Connection test failed:', error);
      reply.status(500);
      return {
        success: false,
        error: error.message || 'Connection test failed'
      };
    }
  });
}
