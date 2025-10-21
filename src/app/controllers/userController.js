import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Chave secreta para JWT (em produção, use variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-aqui';

// ===== REGISTRAR USUÁRIO =====
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, tipo_user } = req.body;

    // As validações agora são feitas pelo middleware Yup
    // Os dados já chegam aqui validados e limpos

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Usuário já existe com este email'
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tipo_user: tipo_user || 'WAITER', // Padrão: WAITER
        status_user: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        tipo_user: true,
        status_user: true,
        created_at: true
      }
    });

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        tipo_user: newUser.tipo_user 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: newUser,
      token
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== LOGIN DE USUÁRIO =====
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // As validações agora são feitas pelo middleware Yup

    // Buscar usuário por email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Verificar se usuário está ativo
    if (user.status_user !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Usuário inativo. Entre em contato com o administrador'
      });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        tipo_user: user.tipo_user 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Dados do usuário (sem senha)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      tipo_user: user.tipo_user,
      status_user: user.status_user,
      created_at: user.created_at
    };

    res.json({
      message: 'Login realizado com sucesso',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== LISTAR TODOS OS USUÁRIOS =====
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        tipo_user: true,
        status_user: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      message: 'Usuários listados com sucesso',
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== BUSCAR USUÁRIO POR ID =====
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        tipo_user: true,
        status_user: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      message: 'Usuário encontrado',
      user
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== ATUALIZAR USUÁRIO =====
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, tipo_user, status_user } = req.body;

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Se email foi alterado, verificar se não existe outro usuário com o mesmo
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email }
      });

      if (emailInUse) {
        return res.status(400).json({
          error: 'Este email já está sendo usado por outro usuário'
        });
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(tipo_user && { tipo_user }),
        ...(status_user && { status_user })
      },
      select: {
        id: true,
        name: true,
        email: true,
        tipo_user: true,
        status_user: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// ===== DELETAR USUÁRIO =====
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};