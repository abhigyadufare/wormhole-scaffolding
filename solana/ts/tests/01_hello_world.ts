import { expect } from "chai";
import * as web3 from "@solana/web3.js";
import {
  deriveAddress,
  getPostMessageCpiAccounts,
} from "@certusone/wormhole-sdk/solana";
import {
  createHelloWorldProgramInterface,
  createInitializeInstruction,
  createRegisterForeignEmitterInstruction,
  createSendMessageInstruction,
  deriveConfigKey,
  deriveForeignEmitterKey,
  deriveWormholeMessageKey,
  getConfigData,
  getForeignEmitterData,
} from "../sdk/01_hello_world";
import {
  FUZZ_TEST_ITERATIONS,
  HELLO_WORLD_ADDRESS,
  LOCALHOST,
  PAYER_PRIVATE_KEY,
  WORMHOLE_ADDRESS,
} from "./helpers/consts";
import { errorExistsInLog } from "./helpers/error";
import { getPostedMessage } from "@certusone/wormhole-sdk/solana/wormhole";

describe(" 1: Hello World", () => {
  const connection = new web3.Connection(LOCALHOST, "confirmed");
  const payer = web3.Keypair.fromSecretKey(PAYER_PRIVATE_KEY);

  // program interface
  const program = createHelloWorldProgramInterface(
    connection,
    HELLO_WORLD_ADDRESS
  );

  // foreign emitter info
  const foreignEmitterChain = 2;
  const foreignEmitterAddress = Buffer.alloc(32, "deadbeef", "hex");

  describe("Initialize Program", () => {
    describe("Fuzz Test Invalid Accounts for Instruction: initialize", () => {
      const wormholeCpi = getPostMessageCpiAccounts(
        program.programId,
        WORMHOLE_ADDRESS,
        payer.publicKey,
        web3.PublicKey.default // dummy for message
      );

      it("Invalid Account: config", async () => {
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const config = deriveAddress(
            [Buffer.from(`Bogus ${i}`)],
            program.programId
          );

          const initializeTx = await program.methods
            .initialize()
            .accounts({
              owner: payer.publicKey,
              config,
              wormholeProgram: WORMHOLE_ADDRESS,
              wormholeConfig: wormholeCpi.wormholeConfig,
              wormholeFeeCollector: wormholeCpi.wormholeFeeCollector,
              wormholeEmitter: wormholeCpi.wormholeEmitter,
              wormholeSequence: wormholeCpi.wormholeSequence,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(
                  reason,
                  "Cross-program invocation with unauthorized signer or writable account"
                )
              ).to.be.true;
              return null;
            });
          expect(initializeTx).is.null;
        }
      });

      it("Invalid Account: wormhole_program", async () => {
        // First create invalid wormhole program and derive CPI PDAs
        // from this bogus address.
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const wormholeProgram = web3.Keypair.generate().publicKey;
          const cpi = getPostMessageCpiAccounts(
            program.programId,
            wormholeProgram,
            payer.publicKey,
            web3.PublicKey.default // dummy for message
          );

          const initializeTx = await program.methods
            .initialize()
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              wormholeProgram,
              wormholeConfig: cpi.wormholeConfig,
              wormholeFeeCollector: cpi.wormholeFeeCollector,
              wormholeEmitter: cpi.wormholeEmitter,
              wormholeSequence: cpi.wormholeSequence,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(errorExistsInLog(reason, "InvalidWormholeProgram")).to.be
                .true;
              return null;
            });
          expect(initializeTx).is.null;
        }

        // Now just pass an invalid Wormhole program address
        // while passing in the correct PDAs.
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const wormholeProgram = web3.Keypair.generate().publicKey;

          const initializeTx = await program.methods
            .initialize()
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              wormholeProgram,
              wormholeConfig: wormholeCpi.wormholeConfig,
              wormholeFeeCollector: wormholeCpi.wormholeFeeCollector,
              wormholeEmitter: wormholeCpi.wormholeEmitter,
              wormholeSequence: wormholeCpi.wormholeSequence,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(errorExistsInLog(reason, "InvalidWormholeProgram")).to.be
                .true;
              return null;
            });
          expect(initializeTx).is.null;
        }
      });

      it("Invalid Account: wormhole_config", async () => {
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const wormholeConfig = deriveAddress(
            [Buffer.from(`Bogus ${i}`)],
            web3.Keypair.generate().publicKey
          );

          const initializeTx = await program.methods
            .initialize()
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              wormholeProgram: WORMHOLE_ADDRESS,
              wormholeConfig,
              wormholeFeeCollector: wormholeCpi.wormholeFeeCollector,
              wormholeEmitter: wormholeCpi.wormholeEmitter,
              wormholeSequence: wormholeCpi.wormholeSequence,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(reason, "A seeds constraint was violated")
              ).to.be.true;
              return null;
            });
          expect(initializeTx).is.null;
        }
      });

      it("Invalid Account: wormhole_fee_collector", async () => {
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const wormholeFeeCollector = deriveAddress(
            [Buffer.from(`Bogus ${i}`)],
            web3.Keypair.generate().publicKey
          );

          const initializeTx = await program.methods
            .initialize()
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              wormholeProgram: WORMHOLE_ADDRESS,
              wormholeConfig: wormholeCpi.wormholeConfig,
              wormholeFeeCollector,
              wormholeEmitter: wormholeCpi.wormholeEmitter,
              wormholeSequence: wormholeCpi.wormholeSequence,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(reason, "A seeds constraint was violated")
              ).to.be.true;
              return null;
            });
          expect(initializeTx).is.null;
        }
      });

      it("Invalid Account: wormhole_emitter", async () => {
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const wormholeEmitter = deriveAddress(
            [Buffer.from(`Bogus ${i}`)],
            web3.Keypair.generate().publicKey
          );

          const initializeTx = await program.methods
            .initialize()
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              wormholeProgram: WORMHOLE_ADDRESS,
              wormholeConfig: wormholeCpi.wormholeConfig,
              wormholeFeeCollector: wormholeCpi.wormholeFeeCollector,
              wormholeEmitter,
              wormholeSequence: wormholeCpi.wormholeSequence,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(reason, "A seeds constraint was violated")
              ).to.be.true;
              return null;
            });
          expect(initializeTx).is.null;
        }
      });

      it("Invalid Account: wormhole_sequence", async () => {
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const wormholeSequence = deriveAddress(
            [Buffer.from(`Bogus ${i}`)],
            web3.Keypair.generate().publicKey
          );

          const initializeTx = await program.methods
            .initialize()
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              wormholeProgram: WORMHOLE_ADDRESS,
              wormholeConfig: wormholeCpi.wormholeConfig,
              wormholeFeeCollector: wormholeCpi.wormholeFeeCollector,
              wormholeEmitter: wormholeCpi.wormholeSequence,
              wormholeSequence,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(reason, "A seeds constraint was violated")
              ).to.be.true;
              return null;
            });
          expect(initializeTx).is.null;
        }
      });
    });

    describe("Finally Set Up Program", () => {
      it("Instruction: initialize", async () => {
        const initializeTx = await createInitializeInstruction(
          connection,
          HELLO_WORLD_ADDRESS,
          payer.publicKey,
          WORMHOLE_ADDRESS
        )
          .then((ix) =>
            web3.sendAndConfirmTransaction(
              connection,
              new web3.Transaction().add(ix),
              [payer]
            )
          )
          .catch((reason) => {
            // should not happen
            console.log(reason);
            return null;
          });
        expect(initializeTx).is.not.null;

        // verify account data
        const configData = await getConfigData(connection, program.programId);
        expect(configData.owner.equals(payer.publicKey)).to.be.true;

        const wormholeCpi = getPostMessageCpiAccounts(
          program.programId,
          WORMHOLE_ADDRESS,
          payer.publicKey,
          web3.PublicKey.default // dummy for message
        );
        expect(configData.wormhole.program.equals(WORMHOLE_ADDRESS)).to.be.true;
        expect(configData.wormhole.config.equals(wormholeCpi.wormholeConfig)).to
          .be.true;
        expect(
          configData.wormhole.feeCollector.equals(
            wormholeCpi.wormholeFeeCollector
          )
        ).to.be.true;
        expect(configData.wormhole.emitter.equals(wormholeCpi.wormholeEmitter))
          .to.be.true;
        expect(
          configData.wormhole.sequence.equals(wormholeCpi.wormholeSequence)
        ).to.be.true;

        expect(configData.bump).is.greaterThanOrEqual(0);
        expect(configData.bump).is.lessThanOrEqual(255);
        expect(configData.messageCount).to.equal(0n);
      });

      it("Cannot Call Instruction Again: initialize", async () => {
        const initializeTx = await createInitializeInstruction(
          connection,
          HELLO_WORLD_ADDRESS,
          payer.publicKey,
          WORMHOLE_ADDRESS
        )
          .then((ix) =>
            web3.sendAndConfirmTransaction(
              connection,
              new web3.Transaction().add(ix),
              [payer]
            )
          )
          .catch((reason) => {
            expect(errorExistsInLog(reason, "already in use")).to.be.true;
            return null;
          });
        expect(initializeTx).is.null;
      });
    });
  });

  describe("Register Foreign Emitter", () => {
    describe("Fuzz Test Invalid Accounts for Instruction: register_foreign_emitter", () => {
      const emitterChain = foreignEmitterChain;
      const emitterAddress = foreignEmitterAddress;

      it("Invalid Account: owner", async () => {
        const nonOwners = [];

        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          nonOwners.push(web3.Keypair.generate());
        }

        // Airdrop funds for these a-holes
        await Promise.all(
          nonOwners.map(async (nonOwner) => {
            await connection
              .requestAirdrop(nonOwner.publicKey, 69 * web3.LAMPORTS_PER_SOL)
              .then((tx) => connection.confirmTransaction(tx));
          })
        );

        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const nonOwner = nonOwners[i];

          const registerForeignEmitterTx = await program.methods
            .registerForeignEmitter(emitterChain, [...emitterAddress])
            .accounts({
              owner: nonOwner.publicKey,
              config: deriveConfigKey(program.programId),
              foreignEmitter: deriveForeignEmitterKey(
                program.programId,
                emitterChain
              ),
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [nonOwner]
              )
            )
            .catch((reason) => {
              expect(errorExistsInLog(reason, "PermissionDenied")).to.be.true;
              return null;
            });
          expect(registerForeignEmitterTx).is.null;
        }
      });

      it("Invalid Account: config", async () => {
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const config = deriveAddress(
            [Buffer.from(`Bogus ${i}`)],
            program.programId
          );

          const registerForeignEmitterTx = await program.methods
            .registerForeignEmitter(emitterChain, [...emitterAddress])
            .accounts({
              owner: payer.publicKey,
              config,
              foreignEmitter: deriveForeignEmitterKey(
                program.programId,
                emitterChain
              ),
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(
                  reason,
                  "The program expected this account to be already initialized"
                )
              ).to.be.true;
              return null;
            });
          expect(registerForeignEmitterTx).is.null;
        }
      });

      it("Invalid Account: foreign_emitter", async () => {
        // First pass completely bogus PDAs
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          const foreignEmitter = deriveAddress(
            [Buffer.from(`Bogus ${i}`)],
            program.programId
          );

          const registerForeignEmitterTx = await program.methods
            .registerForeignEmitter(emitterChain, [...emitterAddress])
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              foreignEmitter,
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(
                  reason,
                  "Cross-program invocation with unauthorized signer or writable account"
                )
              ).to.be.true;
              return null;
            });
          expect(registerForeignEmitterTx).is.null;
        }

        // Now try to pass PDAs that do not agree with chain from instruction data
        for (let i = 0; i < FUZZ_TEST_ITERATIONS; ++i) {
          // we'll use "i" as the chain id
          const intendedEmitterChain = i;
          const bogusEmitterChain = intendedEmitterChain + 1;

          const registerForeignEmitterTx = await program.methods
            .registerForeignEmitter(intendedEmitterChain, [...emitterAddress])
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              foreignEmitter: deriveForeignEmitterKey(
                program.programId,
                bogusEmitterChain
              ),
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(
                  reason,
                  "Cross-program invocation with unauthorized signer or writable account"
                )
              ).to.be.true;
              return null;
            });
          expect(registerForeignEmitterTx).is.null;
        }

        // Now try to pass emitter address with length != 32 bytes
        {
          const bogusEmitterAddress = Buffer.alloc(20, "deadbeef", "hex");
          const registerForeignEmitterTx = await program.methods
            .registerForeignEmitter(emitterChain, [...bogusEmitterAddress])
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              foreignEmitter: deriveForeignEmitterKey(
                program.programId,
                emitterChain
              ),
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(
                errorExistsInLog(
                  reason,
                  "The program could not deserialize the given instruction"
                )
              ).to.be.true;
              return null;
            });
          expect(registerForeignEmitterTx).is.null;
        }

        // Now try to pass zero emitter address
        {
          const bogusEmitterAddress = Buffer.alloc(32);
          const registerForeignEmitterTx = await program.methods
            .registerForeignEmitter(emitterChain, [...bogusEmitterAddress])
            .accounts({
              owner: payer.publicKey,
              config: deriveConfigKey(program.programId),
              foreignEmitter: deriveForeignEmitterKey(
                program.programId,
                emitterChain
              ),
            })
            .instruction()
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              expect(errorExistsInLog(reason, "InvalidForeignEmitter")).to.be
                .true;
              return null;
            });
          expect(registerForeignEmitterTx).is.null;
        }
      });
    });

    describe("Finally Register Foreign Emitter", () => {
      it("Instruction: register_foreign_emitter", async () => {
        const emitterChain = foreignEmitterChain;
        const emitterAddress = Buffer.alloc(32, "fbadc0de", "hex");

        const registerForeignEmitterTx =
          await createRegisterForeignEmitterInstruction(
            connection,
            program.programId,
            payer.publicKey,
            emitterChain,
            emitterAddress
          )
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              // should not happen
              console.log(reason);
              return null;
            });
        expect(registerForeignEmitterTx).is.not.null;

        // verify account data
        const foreignEmitterData = await getForeignEmitterData(
          connection,
          program.programId,
          emitterChain
        );
        expect(foreignEmitterData.chain).to.equal(emitterChain);
        expect(
          Buffer.compare(emitterAddress, foreignEmitterData.address)
        ).to.equal(0);
      });

      it("Call Instruction Again With Different Emitter Address", async () => {
        const emitterChain = foreignEmitterChain;
        const emitterAddress = foreignEmitterAddress;

        const registerForeignEmitterTx =
          await createRegisterForeignEmitterInstruction(
            connection,
            program.programId,
            payer.publicKey,
            emitterChain,
            emitterAddress
          )
            .then((ix) =>
              web3.sendAndConfirmTransaction(
                connection,
                new web3.Transaction().add(ix),
                [payer]
              )
            )
            .catch((reason) => {
              // should not happen
              console.log(reason);
              return null;
            });
        expect(registerForeignEmitterTx).is.not.null;

        // verify account data
        const foreignEmitterData = await getForeignEmitterData(
          connection,
          program.programId,
          emitterChain
        );
        expect(foreignEmitterData.chain).to.equal(emitterChain);
        expect(
          Buffer.compare(emitterAddress, foreignEmitterData.address)
        ).to.equal(0);
      });
    });
  });

  describe("Send Message", () => {
    describe("Finally Send Message", () => {
      const batchId = 42069;
      const payload = Buffer.from("All your base are belong to us");

      it("Instruction: send_message", async () => {
        // save message count to grab posted message later
        const messageCount = await getConfigData(
          connection,
          program.programId
        ).then((config) => config.messageCount);

        const sendMessageTx = await createSendMessageInstruction(
          connection,
          program.programId,
          payer.publicKey,
          WORMHOLE_ADDRESS,
          batchId,
          payload
        )
          .then((ix) =>
            web3.sendAndConfirmTransaction(
              connection,
              new web3.Transaction().add(ix),
              [payer]
            )
          )
          .catch((reason) => {
            // should not happen
            console.log(reason);
            return null;
          });
        expect(sendMessageTx).is.not.null;

        // verify account data
        const messageData = await getPostedMessage(
          connection,
          deriveWormholeMessageKey(program.programId, messageCount)
        ).then((posted) => posted.message);
        expect(messageData.nonce).to.equal(batchId);
        expect(Buffer.compare(messageData.payload, payload)).to.equal(0);
      });
    });
  });
});
