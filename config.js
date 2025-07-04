import { Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

// === Wallet Setup ===
const privateKeyBase58 = process.env.WALLET_PRIVATE_KEY;
if (!privateKeyBase58) throw new Error("WALLET_PRIVATE_KEY is not set in the .env");

export const owner = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));

// === RPC Connection ===
export const connection = new Connection(
  process.env.RPC_URL || clusterApiUrl('mainnet-beta'),
  'confirmed'
);

// === Jupiter Quote/Swap Endpoint ===
export const METIS_JUPITER_BASE_URL = process.env.METIS_JUPITER_BASE_URL;

// === Raydium SDK Setup ===
export const txVersion = TxVersion.V0;
const cluster = 'mainnet';

let raydium;

export const initSdk = async (params = { loadToken: false }) => {
  if (raydium) return raydium;

  if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta')) {
    console.warn('⚠️ Using free RPC, consider upgrading for stability.');
  }

  console.log(`🔌 Connecting to ${connection.rpcEndpoint} (${cluster})`);

  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params.loadToken,
    blockhashCommitment: 'finalized',
  });

  return raydium;
};

// === Token Account Fetcher (used by both bots) ===
export const fetchTokenAccountData = async () => {
  const solAccountResp = await connection.getAccountInfo(owner.publicKey);
  const tokenAccountResp = await connection.getTokenAccountsByOwner(owner.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });
  const token2022Resp = await connection.getTokenAccountsByOwner(owner.publicKey, {
    programId: TOKEN_2022_PROGRAM_ID,
  });

  return parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Resp.value],
    },
  });
};

// === Optional gRPC for advanced features (not used currently) ===
export const grpcUrl = process.env.GRPC_URL || '';
export const grpcToken = process.env.GRPC_TOKEN || '';
