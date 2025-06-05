import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Obter __dirname equivalente em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(__dirname, '../.env') });

// Modelo de Jogo
const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do jogo é obrigatório'],
      trim: true,
    },
    provider: {
      type: String,
      required: [true, 'Provedor do jogo é obrigatório'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['slots', 'table', 'live', 'crash', 'sport', 'arcade', 'other', 'Slots', 'Arcade', 'Megaways', 'Fish Games', 'Jackpot', 'Crash Games', 'Table Games', 'Instant Win', 'Card Games', 'Live Casino'],
      default: 'slots',
    },
    imageUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    minBet: {
      type: Number,
      default: 1,
    },
    maxBet: {
      type: Number,
      default: 1000,
    },
    rtp: {
      type: Number,
      min: 0,
      max: 100,
      default: 95,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    gameConfig: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Registrar o modelo
const Game = mongoose.model('Game', gameSchema);

// Lista de jogos a serem adicionados
const games = [
  {
    name: "Treasure Riches",
    imageUrl: "https://9d.bet.br/images/game/551915.jpg",
    provider: "Evolution Gaming",
    category: "Megaways",
    isActive: true,
    popularity: 52
  },
  {
    name: "Dragon Wealth",
    imageUrl: "https://9d.bet.br/images/game/551931.jpg",
    provider: "No Limit City",
    category: "Megaways",
    isActive: true,
    popularity: 52
  },
  {
    name: "Cosmic Riches",
    imageUrl: "https://9d.bet.br/images/game/551921.jpg",
    provider: "Red Tiger",
    category: "Fish Games",
    isActive: true,
    popularity: 57
  },
  {
    name: "Emerald Win",
    imageUrl: "https://9d.bet.br/images/game/551192.jpg",
    provider: "Yggdrasil",
    category: "Fish Games",
    isActive: true,
    popularity: 95,
    isFeatured: true
  },
  {
    name: "Phoenix Wealth",
    imageUrl: "https://9d.bet.br/images/game/551934.jpg",
    provider: "No Limit City",
    category: "Jackpot",
    isActive: true,
    popularity: 85
  },
  {
    name: "Tiger Wealth",
    imageUrl: "https://9d.bet.br/images/game/551932.jpg",
    provider: "PG Soft",
    category: "Crash Games",
    isActive: true,
    popularity: 70
  },
  {
    name: "Panda Wealth",
    imageUrl: "https://9d.bet.br/images/game/551933.jpg",
    provider: "Evolution Gaming",
    category: "Arcade",
    isActive: true,
    popularity: 81
  },
  {
    name: "Wild Wealth",
    imageUrl: "https://9d.bet.br/images/game/551935.jpg",
    provider: "PG Soft",
    category: "Jackpot",
    isActive: true,
    popularity: 71
  },
  {
    name: "Grand Wealth",
    imageUrl: "https://9d.bet.br/images/game/551936.jpg",
    provider: "NetEnt",
    category: "Table Games",
    isActive: true,
    popularity: 65
  },
  {
    name: "Mega Wealth",
    imageUrl: "https://9d.bet.br/images/game/551937.jpg",
    provider: "Quickspin",
    category: "Crash Games",
    isActive: true,
    popularity: 56
  },
  {
    name: "Super Wealth",
    imageUrl: "https://9d.bet.br/images/game/551938.jpg",
    provider: "ELK Studios",
    category: "Instant Win",
    isActive: true,
    popularity: 66
  },
  {
    name: "Ultra Wealth",
    imageUrl: "https://9d.bet.br/images/game/551939.jpg",
    provider: "Microgaming",
    category: "Table Games",
    isActive: true,
    popularity: 66
  },
  {
    name: "Enchanted Wealth",
    imageUrl: "https://9d.bet.br/images/game/551948.jpg",
    provider: "Pragmatic Play",
    category: "Arcade",
    isActive: true,
    popularity: 58
  },
  {
    name: "Divine Wealth",
    imageUrl: "https://9d.bet.br/images/game/551947.jpg",
    provider: "NetEnt",
    category: "Arcade",
    isActive: true,
    popularity: 63
  },
  {
    name: "Diamond Wealth",
    imageUrl: "https://9d.bet.br/images/game/551941.jpg",
    provider: "BTG",
    category: "Instant Win",
    isActive: true,
    popularity: 56
  },
  {
    name: "Phoenix Treasure",
    imageUrl: "https://9d.bet.br/images/game/551634.jpg",
    provider: "No Limit City",
    category: "Jackpot",
    isActive: true,
    popularity: 57
  },
  {
    name: "Lucky Wealth",
    imageUrl: "https://9d.bet.br/images/game/551926.jpg",
    provider: "Yggdrasil",
    category: "Table Games",
    isActive: true,
    popularity: 78
  },
  {
    name: "Treasure Wealth",
    imageUrl: "https://9d.bet.br/images/game/551940.jpg",
    provider: "Red Tiger",
    category: "Table Games",
    isActive: true,
    popularity: 75
  },
  {
    name: "Sapphire Wealth",
    imageUrl: "https://9d.bet.br/images/game/551944.jpg",
    provider: "Play'n GO",
    category: "Megaways",
    isActive: true,
    popularity: 85
  },
  {
    name: "Ancient Wealth",
    imageUrl: "https://9d.bet.br/images/game/551945.jpg",
    provider: "PG Soft",
    category: "Instant Win",
    isActive: true,
    popularity: 89,
    isFeatured: true
  },
  {
    name: "Fantasy Wealth",
    imageUrl: "https://9d.bet.br/images/game/551949.jpg",
    provider: "Playtech",
    category: "Card Games",
    isActive: true,
    popularity: 55
  },
  {
    name: "Lucky Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551951.jpg",
    provider: "No Limit City",
    category: "Megaways",
    isActive: true,
    popularity: 77
  },
  {
    name: "Emerald Wealth",
    imageUrl: "https://9d.bet.br/images/game/551942.jpg",
    provider: "Relax Gaming",
    category: "Jackpot",
    isActive: true,
    popularity: 79
  },
  {
    name: "Ruby Wealth",
    imageUrl: "https://9d.bet.br/images/game/551943.jpg",
    provider: "Habanero",
    category: "Arcade",
    isActive: true,
    popularity: 53
  },
  {
    name: "Cosmic Wealth",
    imageUrl: "https://9d.bet.br/images/game/551946.jpg",
    provider: "Evolution Gaming",
    category: "Megaways",
    isActive: true,
    popularity: 89,
    isFeatured: true
  },
  {
    name: "Fortune Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551950.jpg",
    provider: "Playtech",
    category: "Live Casino",
    isActive: true,
    popularity: 93,
    isFeatured: true
  },
  {
    name: "Golden Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551952.jpg",
    provider: "Yggdrasil",
    category: "Slots",
    isActive: true,
    popularity: 68
  },
  {
    name: "Magic Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551953.jpg",
    provider: "Relax Gaming",
    category: "Fish Games",
    isActive: true,
    popularity: 54
  },
  {
    name: "Mystic Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551954.jpg",
    provider: "No Limit City",
    category: "Jackpot",
    isActive: true,
    popularity: 52
  },
  {
    name: "Royal Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551955.jpg",
    provider: "Red Tiger",
    category: "Live Casino",
    isActive: true,
    popularity: 70
  },
  {
    name: "Dragon Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551956.jpg",
    provider: "Microgaming",
    category: "Crash Games",
    isActive: true,
    popularity: 67
  },
  {
    name: "Tiger Jackpot",
    imageUrl: "https://9d.bet.br/images/game/551957.jpg",
    provider: "ELK Studios",
    category: "Table Games",
    isActive: true,
    popularity: 56
  }
];

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Função para adicionar jogos ao banco de dados
const seedGames = async () => {
  try {
    console.log('🚀 Iniciando seed dos jogos...');
    
    // Conectar ao banco de dados
    await connectDB();

    // Verificar se há jogos existentes
    const existingGamesCount = await Game.countDocuments();
    console.log(`📊 Jogos existentes no banco: ${existingGamesCount}`);

    // Limpar todos os jogos existentes (opcional)
    if (existingGamesCount > 0) {
      console.log('🗑️ Removendo jogos existentes...');
      await Game.deleteMany({});
      console.log('✅ Jogos existentes removidos com sucesso!');
    }

    // Adicionar novos jogos
    console.log('📥 Adicionando novos jogos...');
    const insertedGames = await Game.insertMany(games);

    console.log(`🎉 ${insertedGames.length} jogos foram adicionados com sucesso!`);
    
    // Estatísticas dos jogos adicionados
    const featuredCount = insertedGames.filter(game => game.isFeatured).length;
    const categoryStats = {};
    
    insertedGames.forEach(game => {
      categoryStats[game.category] = (categoryStats[game.category] || 0) + 1;
    });

    console.log('\n📈 Estatísticas:');
    console.log(`   • Jogos em destaque: ${featuredCount}`);
    console.log('   • Por categoria:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`     - ${category}: ${count} jogos`);
    });
    
    // Fechar a conexão
    await mongoose.connection.close();
    console.log('🔌 Conexão com o MongoDB fechada');
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Erro ao adicionar jogos: ${error.message}`);
    
    // Tentar fechar a conexão mesmo em caso de erro
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error(`❌ Erro ao fechar conexão: ${closeError.message}`);
    }
    
    process.exit(1);
  }
};

// Executar o script
seedGames();