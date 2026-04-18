import { prisma } from '@/lib/db';

const AGENT_ENABLED = process.env.ENABLE_AI_AGENT === 'true';

interface AgentDecision {
  action: string;
  reason: string;
  data?: Record<string, unknown>;
}

// Log all agent decisions to OrderStatusUpdate for audit trail
async function logDecision(orderId: string, decision: AgentDecision) {
  await prisma.orderStatusUpdate.create({
    data: {
      orderId,
      fromStatus: '',
      toStatus: decision.action,
      note: `[AI Agent] ${decision.reason}`,
    },
  });
}

// 1. Validate order completeness
export async function validateOrder(orderId: string): Promise<AgentDecision> {
  if (!AGENT_ENABLED) return { action: 'skip', reason: 'Agent disabled' };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { action: 'error', reason: 'Order not found' };

  const missing: string[] = [];
  if (!order.recName) missing.push('recipient name');
  if (!order.howMet && !order.memories) missing.push('story details');
  if (!order.mood) missing.push('mood');

  const decision: AgentDecision = missing.length > 0
    ? { action: 'incomplete', reason: `Missing: ${missing.join(', ')}`, data: { missing } }
    : { action: 'complete', reason: 'Order is complete and ready for production' };

  await logDecision(orderId, decision);
  return decision;
}

// 2. Suggest package upgrade based on story complexity
export async function suggestUpgrade(orderId: string): Promise<AgentDecision> {
  if (!AGENT_ENABLED) return { action: 'skip', reason: 'Agent disabled' };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { action: 'error', reason: 'Order not found' };

  const storyLength = (order.howMet?.length || 0) + (order.memories?.length || 0) + (order.loveAbout?.length || 0);
  const hasMultipleGenres = order.genres ? JSON.parse(order.genres).length > 2 : false;

  let decision: AgentDecision;
  if (order.packageId === 'Basic' && storyLength > 500) {
    decision = { action: 'suggest_upgrade', reason: 'Rich story would benefit from Standard package (more verses, 2 revisions)', data: { suggestedPackage: 'Standard' } };
  } else if (order.packageId === 'Standard' && (storyLength > 1000 || hasMultipleGenres)) {
    decision = { action: 'suggest_upgrade', reason: 'Complex story with multiple genres — Premium gives unlimited revisions', data: { suggestedPackage: 'Premium' } };
  } else {
    decision = { action: 'no_upgrade', reason: 'Package matches story complexity' };
  }

  await logDecision(orderId, decision);
  return decision;
}

// 3. Auto-assign creator based on genre/language
export async function autoAssignCreator(orderId: string): Promise<AgentDecision> {
  if (!AGENT_ENABLED) return { action: 'skip', reason: 'Agent disabled' };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.creatorId) return { action: 'skip', reason: order?.creatorId ? 'Already assigned' : 'Order not found' };

  // Find available creators
  const creators = await prisma.user.findMany({ where: { role: 'creator' } });
  if (creators.length === 0) return { action: 'no_creators', reason: 'No creators available' };

  // Simple round-robin assignment (in production, match by genre/language expertise)
  const orderCount = await prisma.order.count();
  const assignedCreator = creators[orderCount % creators.length];

  await prisma.order.update({
    where: { id: orderId },
    data: { creatorId: assignedCreator.id },
  });

  const decision: AgentDecision = {
    action: 'assigned',
    reason: `Auto-assigned to ${assignedCreator.name} (round-robin)`,
    data: { creatorId: assignedCreator.id, creatorName: assignedCreator.name },
  };
  await logDecision(orderId, decision);
  return decision;
}

// Run full pipeline on a new order
export async function processNewOrder(orderId: string): Promise<AgentDecision[]> {
  if (!AGENT_ENABLED) return [{ action: 'skip', reason: 'Agent disabled' }];

  const results: AgentDecision[] = [];
  results.push(await validateOrder(orderId));
  results.push(await suggestUpgrade(orderId));
  results.push(await autoAssignCreator(orderId));
  return results;
}
