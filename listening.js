import { ethers } from 'ethers';
import mongoose from 'mongoose';
import Token from './models/tokenModel.js';
const mongoURI = 'mongodb+srv://andriygoryachiy16:gopro2323@cluster0.mncivfx.mongodb.net/';

const RPC_URL = "https://mainnet.infura.io/v3/3a6d58c9be5442af847a45e9ea966c21"
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const deployedContracts = new Set(); // Множина для зберігання унікальних контрактів


const newToken = new Token({
    address: 'John Doe',
    chain: 'ETH',
  });

const connectDB = async () => {
    try {
      if (!mongoURI) {
        console.error('MONGODB_URI environment variable is not set');
      } else {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
      }
    
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  };

async function fetchDeployedContracts() {
    try {
        await connectDB();


        // Постійно очікувати нового блоку
        provider.on('block', async (blockNumber) => {
            const block = await provider.getBlockWithTransactions(blockNumber);

            // Перевірка, чи блок містить транзакції
            if (block.transactions.length > 0) {
                for (const transaction of block.transactions) {
                    // Перевірка, чи транзакція є деплоєм контракту
                    if (transaction.to === null && transaction.creates) {
                        // Перевірка, чи контракт ще не був записаний
                        if (!deployedContracts.has(transaction.creates)) {
                            deployedContracts.add(transaction.creates); // Додати контракт до множини

                            const contract = new ethers.Contract(transaction.creates, ['function decimals() public view returns (uint8)'], provider);

                            try {
                                const decimals = await contract.decimals();

                                // Перевірка, чи контракт є ERC20 контрактом (якщо метод decimals не викидає помилку)
                                if (decimals) {

                                    console.log("Знайдено новий контракт: " + transaction.creates);

                                    try {
                                        const newToken = new Token({
                                          _id: Date.now().toString(), // Використовуємо Date.now() як _id
                                          address: transaction.creates,
                                          chain: 'ETH',
                                        });
                                        
                                        // Записуємо в базу
                                        newToken.save()
                                          .then((result) => {
                                            console.log('Token saved:', result);
                                          })
                                          .catch(async (err) => {
                                            if (err.code === 11000 && err.keyPattern && err.keyPattern._id === 1) {
                                              // Якщо виникла помилка "duplicate key" для _id, то змінюємо _id та повторно намагаємося зберегти запис
                                              const existingToken = await Token.findOne({ _id: newToken._id });
                                              if (existingToken) {
                                                // Якщо _id існує, збільшуємо його на 1
                                                newToken._id = (parseInt(existingToken._id) + 1).toString();
                                                newToken.save()
                                                  .then((result) => {
                                                    console.log('Token saved with incremented _id:', result);
                                                  })
                                                  .catch((err) => {
                                                    console.error('Error saving token with incremented _id:', err);
                                                  });
                                              }
                                            } else {
                                              console.error('Error saving token:', err);
                                            }
                                          });
                                      } catch (error) {
                                        console.error("Error adding document: ", error);
                                      }  
                                }
                            } catch (error) {
                                // Ігнорувати помилку, якщо метод decimals не існує або викидає помилку
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Помилка при отриманні задеплоєних контрактів:', error);
    }
}

fetchDeployedContracts();