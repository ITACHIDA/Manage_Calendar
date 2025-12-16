import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;

  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendar/events?$orderby=start/dateTime&$top=100&$select=id,subject,start,end,location,organizer,isCancelled,webLink,bodyPreview',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.timezone="UTC"', // normalize start/end to UTC to avoid local skew
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Graph request failed', details: text }, { status: res.status });
    }
    const data = await res.json();
    const toIsoUtc = (dt?: string) => {
      if (!dt) return undefined;
      return dt.endsWith('Z') ? dt : `${dt}Z`;
    };

    const events =
      data.value?.map((evt: any) => ({
        id: evt.id,
        title: evt.subject || 'Untitled',
        start: toIsoUtc(evt.start?.dateTime),
        end: toIsoUtc(evt.end?.dateTime),
        location: evt.location?.displayName || '',
        organizer: evt.organizer?.emailAddress?.name,
        isCancelled: evt.isCancelled ?? false,
        webLink: evt.webLink,
        description: evt.bodyPreview || '',
      })) ?? [];

    return NextResponse.json({ events });
  } catch (err) {
    console.error('Graph fetch error', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
