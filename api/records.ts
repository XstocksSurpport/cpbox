import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkAdminPassword,
  loadRecords,
  saveRecord,
  storageReady,
} from './_lib/store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body = req.body as {
      type?: string;
      wallet?: string;
      mintAddress?: string;
      tokenName?: string;
      action?: string;
      signature?: string;
    };

    if (!body.wallet || !body.action) {
      return res.status(400).json({ error: '缺少参数' });
    }

    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: body.type || 'other',
      wallet: body.wallet,
      mintAddress: body.mintAddress || '',
      tokenName: body.tokenName || '',
      action: body.action,
      signature: body.signature,
      timestamp: Date.now(),
    };

    if (storageReady()) {
      await saveRecord(record);
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: false, reason: 'no_storage' });
  }

  if (req.method === 'GET') {
    if (!checkAdminPassword(req)) {
      return res.status(401).json({ error: '未授权' });
    }

    const records = await loadRecords();
    return res.status(200).json(records);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
