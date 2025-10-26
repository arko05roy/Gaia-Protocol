import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // Read the deployment config from the web3 directory
    const configPath = path.join(process.cwd(), '..', 'web3', 'deployments', 'l2-addresses.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read deployment config:', error);
    return NextResponse.json(
      { error: 'Failed to load deployment config' },
      { status: 500 }
    );
  }
}
