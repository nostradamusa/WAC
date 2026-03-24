import { supabase } from "@/lib/supabase";

export type AdminActionType = 
  | "GRANT_VERIFICATION" 
  | "REVOKE_VERIFICATION" 
  | "SUSPEND_ENTITY" 
  | "UNSUSPEND_ENTITY" 
  | "HARD_DELETE_ENTITY" 
  | "DISMISS_REPORT";

export type EntityType = "profile" | "business" | "organization" | "group" | "report" | "feedback";

/**
 * Irrefutably records an administrative action into the append-only database ledger.
 * This execution cannot be reverted, modified, or deleted even by highly-privileged database roles.
 */
export async function logAdminAction(
  actionType: AdminActionType,
  entityType: EntityType,
  entityId: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      console.error("Auditing blocked: Active administrative identity could not be verified.");
      return false;
    }

    const { error: insertErr } = await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata
    });

    if (insertErr) {
      console.error("CRITICAL: Failed to append admin telemetry trace. Network drop or permissions boundary.", insertErr);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("CRITICAL: Fatal execution evaluating trace ledger append.", err);
    return false;
  }
}
