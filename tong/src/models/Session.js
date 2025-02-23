// Session model only (no transcript)
export const Session = {
    collection: 'sessions',
    fields: {
      learnerId: { type: 'string', required: true },
      expertId: { type: 'string', required: true },
      startTime: { type: 'timestamp', required: true },
      endTime: { type: 'timestamp', required: true },
      title: { type: 'string', required: true },
      roomId: { type: 'string', required: true },
      createdAt: { type: 'timestamp', required: true }
    }
  };