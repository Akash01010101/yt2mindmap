import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from('mindmap_usage')
      .update({ tos_timestamp: new Date().toISOString() })
      .eq('user_id', session.user.email);

    if (updateError) {
      console.error('Error updating TOS timestamp:', updateError);
      return NextResponse.json({ error: 'Failed to update TOS status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in TOS check endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}