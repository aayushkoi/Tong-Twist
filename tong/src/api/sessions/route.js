import { NextResponse } from 'next/server';
import { firestore } from '@/fb/firebase';
import { getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { learnerId, expertId, startTime, endTime, title } = await request.json();
    
    const sessionData = {
      learnerId,
      expertId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      title,
      createdAt: serverTimestamp(),
      roomId: crypto.randomUUID(), // Generate unique room ID
    };

    const docRef = await addDoc(collection(firestore, 'sessions'), sessionData);
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...sessionData 
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    const field = role === 'learner' ? 'learnerId' : 'expertId';
    const snapshot = await getDocs(
      query(
        collection(firestore, 'sessions'),
        where(field, '==', userId)
      )
    );

    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime.toDate().toISOString(),
      endTime: doc.data().endTime.toDate().toISOString()
    }));

    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}