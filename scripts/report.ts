#!/usr/bin/env tsx
/**
 * Platform自動報告スクリプト
 * 現在のリポジトリ状態をLuckyFields Platformに報告
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ReportData {
  repo: string;
  owner: string;
  commit: string;
  branch: string;
  message: string;
  updated_at: string;
  status: 'success' | 'failure';
  metadata?: {
    version?: string;
    buildTime?: string;
    environment?: string;
  };
}

function getGitInfo(): Omit<ReportData, 'repo' | 'owner' | 'status' | 'updated_at'> {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    
    return { commit, branch, message };
  } catch (error) {
    console.error('Git情報の取得に失敗:', error);
    return {
      commit: 'unknown',
      branch: 'unknown', 
      message: 'Git information unavailable'
    };
  }
}

function getPackageInfo() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return {
      version: packageJson.version,
      environment: process.env.NODE_ENV || 'development'
    };
  } catch (error) {
    console.warn('package.json読み込み失敗:', error);
    return {};
  }
}

async function sendReport(data: ReportData): Promise<void> {
  const reportUrl = process.env.PLATFORM_REPORT_URL;
  
  if (!reportUrl) {
    console.log('📝 PLATFORM_REPORT_URL未設定 - レポート送信をスキップ');
    return;
  }

  try {
    console.log('📡 Platform報告送信中...');
    console.log(`📍 送信先: ${reportUrl}`);
    console.log(`📦 リポジトリ: ${data.repo}`);
    console.log(`🌿 ブランチ: ${data.branch}`);
    console.log(`📝 コミット: ${data.commit.substring(0, 7)}`);

    const response = await fetch(reportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LuckyFields-Reporter/1.0.0'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.text();
    console.log('✅ Platform報告送信完了');
    
    if (result) {
      console.log('📄 レスポンス:', result);
    }
  } catch (error) {
    console.error('❌ Platform報告送信失敗:', error);
    
    // CI環境では失敗を通知するが、開発環境では警告のみ
    if (process.env.CI) {
      process.exit(1);
    }
  }
}

async function main() {
  // 開発環境ではレポート送信をスキップ（環境変数で制御）
  if (!process.env.CI && !process.env.FORCE_PLATFORM_REPORT) {
    console.log('📝 開発環境 - Platform報告をスキップ (FORCE_PLATFORM_REPORT=1 で強制実行可能)');
    return;
  }

  const gitInfo = getGitInfo();
  const packageInfo = getPackageInfo();
  
  const reportData: ReportData = {
    repo: 'kids-daily-quiz',
    owner: 'LuckyFieldsLLC',
    status: 'success',
    updated_at: new Date().toISOString(),
    metadata: {
      buildTime: new Date().toISOString(),
      ...packageInfo
    },
    ...gitInfo
  };

  await sendReport(reportData);
}

// スクリプト直接実行時のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 報告スクリプト実行エラー:', error);
    process.exit(1);
  });
}

export { sendReport, getGitInfo, getPackageInfo };
export type { ReportData };