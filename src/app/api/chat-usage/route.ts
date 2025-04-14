import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
// GET: Fetch user's chat usage count
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await supabase
      .from('mindmap_usage')
      .select('usage_count, isSubscribed, isPaid')
      .eq('user_id', session.user.email)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        // No record found - create initial record
        const { data: newUsage, error: insertError } = await supabase
          .from('mindmap_usage')
          .insert([{ user_id: session.user.email, usage_count: 0 }])
          .select('usage_count')
          .single();

        if (insertError) throw insertError;
        return NextResponse.json({ usage_count: newUsage.usage_count, isSubscribed: false });
      }
      throw error;
    }
    return NextResponse.json({ usage_count: data.usage_count, isSubscribed: data.isSubscribed, isPaid: data.isPaid });
  } catch (error) {
    console.error('Error fetching chat usage:', error);
    return NextResponse.json({ error: 'Failed to fetch chat usage' }, { status: 500 });
  }
}
// POST: Increment usage count 
export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // First get the current usage count
    const { data: currentData, error: fetchError } = await supabase
      .from('mindmap_usage')
      .select('usage_count, isSubscribed')
      .eq('user_id', session.user.email)
      .single();
    if (fetchError) throw fetchError;
    // Then increment it
    const { data, error } = await supabase
      .from('mindmap_usage')
      .update({ 
        usage_count: (currentData.usage_count || 0) + 1,
        last_used: new Date().toISOString()
      })
      .eq('user_id', session.user.email)
      .select('usage_count')
      .single();
    if (error) throw error;
    return NextResponse.json({ usage_count: data.usage_count, isSubscribed: currentData.isSubscribed });
  } catch (error) {
    console.error('Error updating chat usage:', error);
    return NextResponse.json({ error: 'Failed to update chat usage' }, { status: 500 });
  }
}