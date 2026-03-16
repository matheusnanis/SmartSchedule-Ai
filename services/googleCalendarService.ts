
/**
 * Google Calendar API Service
 */

export interface GoogleEvent {
  summary: string;
  location: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export const createCalendarEvent = async (token: string, event: GoogleEvent) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || 'Erro ao criar evento');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na sincronização do Google Calendar:', error);
    throw error;
  }
};
