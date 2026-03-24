import { eq } from "drizzle-orm";
import { generateUuid } from "@/lib/crypto";
import { clients } from "@/lib/db/schemas/clients";
import { db } from "../db_client";

export interface CreateClient {
  email: string;
  name: string;
}

export async function createNewClient(clientData: CreateClient) {
  const id = generateUuid();
  const result = await db
    .insert(clients)
    .values([
      {
        id,
        name: clientData.name,
        email: clientData.email,
      },
    ])
    .returning({
      id: clients.id,
      name: clients.name,
      email: clients.email,
    });

  return result[0];
}

export async function getAllClients() {
  const result = await db.query.clients.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
    },
  });

  return result;
}

export async function deleteClient(clientId: string) {
  await db.delete(clients).where(eq(clients.id, clientId));

  return clientId;
}
