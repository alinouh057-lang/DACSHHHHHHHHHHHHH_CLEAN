// frontend/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Votre logique de proxy ici
  // Exemple: redirection ou modification des headers
  
  return NextResponse.next();
}

// OU export par défaut:
// export default function proxy(request: NextRequest) {
//   return NextResponse.next();
// }