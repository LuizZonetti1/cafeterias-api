import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (opcional)
  console.log('🧹 Limpando dados existentes...');
  await prisma.item_Order.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.item_Product.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.stock_Movement.deleteMany();
  await prisma.waste.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();

  // Criar categorias
  console.log('📂 Criando categorias...');
  const categorias = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Cafés',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Doces',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Salgados',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Bebidas',
      }
    })
  ]);

  // Criar ingredientes
  console.log('🥄 Criando ingredientes...');
  const ingredientes = await Promise.all([
    prisma.ingredient.create({
      data: {
        name: 'Café em grão',
        quantity_general: 1000.0
      }
    }),
    prisma.ingredient.create({
      data: {
        name: 'Leite',
        quantity_general: 500.0
      }
    }),
    prisma.ingredient.create({
      data: {
        name: 'Açúcar',
        quantity_general: 200.0
      }
    }),
    prisma.ingredient.create({
      data: {
        name: 'Chocolate em pó',
        quantity_general: 150.0
      }
    })
  ]);

  // Criar produtos
  console.log('☕ Criando produtos...');
  const produtos = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Café Expresso',
        description: 'Café expresso tradicional',
        price: 4.50,
        categoryId: categorias[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Cappuccino',
        description: 'Cappuccino cremoso com leite vaporizado',
        price: 7.00,
        categoryId: categorias[0].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Pão de Açúcar',
        description: 'Doce tradicional brasileiro',
        price: 3.50,
        categoryId: categorias[1].id
      }
    }),
    prisma.product.create({
      data: {
        name: 'Croissant',
        description: 'Croissant francês fresquinho',
        price: 6.00,
        categoryId: categorias[2].id
      }
    })
  ]);

  // Criar usuários
  console.log('👤 Criando usuários...');
  const usuarios = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin Principal',
        email: 'admin@cafeteria.com',
        password: 'admin123', // Em produção, use hash!
        tipo_user: 'ADMIN',
        status_user: 'ACTIVE'
      }
    }),
    prisma.user.create({
      data: {
        name: 'João Garçom',
        email: 'joao@cafeteria.com',
        password: 'garcom123',
        tipo_user: 'WAITER',
        status_user: 'ACTIVE'
      }
    }),
    prisma.user.create({
      data: {
        name: 'Maria Cozinha',
        email: 'maria@cafeteria.com',
        password: 'cozinha123',
        tipo_user: 'KITCHEN',
        status_user: 'ACTIVE'
      }
    })
  ]);

  console.log('✅ Seed concluído com sucesso!');
  console.log(`📊 Dados criados:`);
  console.log(`   - ${categorias.length} categorias`);
  console.log(`   - ${ingredientes.length} ingredientes`);
  console.log(`   - ${produtos.length} produtos`);
  console.log(`   - ${usuarios.length} usuários`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });