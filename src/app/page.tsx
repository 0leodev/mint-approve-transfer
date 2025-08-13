"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContracts,
} from "wagmi";
import { SUPPORTED_CHAIN, TOKENS } from "../config/web3";
import { TokenManager } from "../components/TokenManager";
import Image from "next/image";
import { formatUnits } from "viem";
import { ERC20_ABI } from "../config/abi";
import { motion } from "framer-motion";

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [targetAddress, setTargetAddress] = useState("");
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [isClient, setIsClient] = useState(false);

  const isWrongNetwork = chainId !== SUPPORTED_CHAIN.id;

  const { data: balances } = useReadContracts({
    contracts: Object.values(TOKENS).map((token) => ({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address!],
    })),
    query: {
      enabled: isConnected && !isWrongNetwork,
      refetchInterval: 5000,
    },
  }) as { data: { result: bigint }[] };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (balances) {
      const total = Object.values(TOKENS).reduce((acc, token, index) => {
        const balance = balances[index]?.result;
        if (balance !== undefined) {
          return acc + Number(formatUnits(balance, token.decimals));
        }
        return acc;
      }, 0);

      setTotalBalance(total.toFixed(2));
    }
  }, [balances]);

  return (
    <main className="p-4 sm:p-6 max-w-6xl mx-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen">
      <div className="flex flex-col gap-0">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
          <h1 className="text-3xl font-bold">MAT</h1>
          <div className="flex flex-wrap items-center gap-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== "loading";
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === "authenticated");

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={openChainModal}
                            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                          >
                            {chain.hasIcon && (
                              <div
                                className="mr-2 rounded-full overflow-hidden"
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                }}
                              >
                                {chain.iconUrl && (
                                  <Image
                                    alt={chain.name ?? "Chain icon"}
                                    src={chain.iconUrl || "/placeholder.svg"}
                                    width={16}
                                    height={16}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                          >
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ""}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
            {isWrongNetwork && (
              <button
                onClick={() => switchChain({ chainId: SUPPORTED_CHAIN.id })}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Switch to Sepolia
              </button>
            )}
          </div>
        </header>

        {isClient && isConnected && !isWrongNetwork && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-700">
              <h2 className="text-2xl text-gray-300 mb-2">Net Worth</h2>
              <motion.p
                className="text-4xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ${totalBalance}
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {isClient && !isConnected && (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="bg-gradient-to-br shadow-xl p-8 rounded-xl text-center">
              <p className="text-2xl font-bold mb-8">
                Please, connect your wallet
              </p>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          </div>
        )}

        {isClient && isConnected && !isWrongNetwork && (
          <>
            <div className="mb-8">
              <label
                htmlFor="targetAddress"
                className="block text-lg font-medium mb-2"
              >
                Target Address:
              </label>
              <input
                id="targetAddress"
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white transition-shadow duration-200"
                placeholder="0x..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TokenManager token={TOKENS.DAI} targetAddress={targetAddress} />
              <TokenManager token={TOKENS.USDC} targetAddress={targetAddress} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
