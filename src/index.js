import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Middleware de log simples
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware global de tratamento de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno no servidor" });
});

// Rota teste
app.get("/", (req, res) => {
  res.send("API DNcommerce rodando 🚀");
});

// --- Produtos ---

// Listar todos os produtos
app.get("/produtos", async (req, res, next) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.status(200).json({ success: true, data: produtos });
  } catch (error) {
    next(error);
  }
});

// Buscar produto pelo id
app.get("/produtos/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      return res.status(404).json({ success: false, error: "Produto não encontrado" });
    }
    res.status(200).json({ success: true, data: produto });
  } catch (error) {
    next(error);
  }
});

// Criar produto
app.post("/produtos", async (req, res, next) => {
  const { nome, preco, estoque } = req.body;
  if (!nome || preco === undefined || estoque === undefined) {
    return res.status(400).json({ success: false, error: "Campos obrigatórios: nome, preco, estoque" });
  }
  try {
    const novoProduto = await prisma.produto.create({ data: { nome, preco, estoque } });
    res.status(201).json({ success: true, data: novoProduto });
  } catch (error) {
    next(error);
  }
});

// Atualizar produto
app.put("/produtos/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  const { nome, preco, estoque } = req.body;
  try {
    const produtoExistente = await prisma.produto.findUnique({ where: { id } });
    if (!produtoExistente) {
      return res.status(404).json({ success: false, error: "Produto não encontrado" });
    }
    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: { nome, preco, estoque },
    });
    res.status(200).json({ success: true, data: produtoAtualizado });
  } catch (error) {
    next(error);
  }
});

// Deletar produto
app.delete("/produtos/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const produtoExistente = await prisma.produto.findUnique({ where: { id } });
    if (!produtoExistente) {
      return res.status(404).json({ success: false, error: "Produto não encontrado" });
    }
    await prisma.produto.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- Clientes ---

// Listar todos os clientes
app.get("/clientes", async (req, res, next) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.status(200).json({ success: true, data: clientes });
  } catch (error) {
    next(error);
  }
});

// Buscar cliente por id
app.get("/clientes/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) {
      return res.status(404).json({ success: false, error: "Cliente não encontrado" });
    }
    res.status(200).json({ success: true, data: cliente });
  } catch (error) {
    next(error);
  }
});

// Criar cliente
app.post("/clientes", async (req, res, next) => {
  const { nome, email } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ success: false, error: "Campos obrigatórios: nome, email" });
  }
  try {
    const novoCliente = await prisma.cliente.create({ data: { nome, email } });
    res.status(201).json({ success: true, data: novoCliente });
  } catch (error) {
    next(error);
  }
});

// Atualizar cliente
app.put("/clientes/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  const { nome, email } = req.body;
  try {
    const clienteExistente = await prisma.cliente.findUnique({ where: { id } });
    if (!clienteExistente) {
      return res.status(404).json({ success: false, error: "Cliente não encontrado" });
    }
    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: { nome, email },
    });
    res.status(200).json({ success: true, data: clienteAtualizado });
  } catch (error) {
    next(error);
  }
});

// Deletar cliente
app.delete("/clientes/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const clienteExistente = await prisma.cliente.findUnique({ where: { id } });
    if (!clienteExistente) {
      return res.status(404).json({ success: false, error: "Cliente não encontrado" });
    }
    await prisma.cliente.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// --- Vendas ---

// Listar todas as vendas
app.get("/vendas", async (req, res, next) => {
  try {
    const vendas = await prisma.venda.findMany({
      include: {
        cliente: true,
        itens: { include: { produto: true } },
      },
    });
    res.status(200).json({ success: true, data: vendas });
  } catch (error) {
    next(error);
  }
});

// Buscar venda por id
app.get("/vendas/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: { include: { produto: true } },
      },
    });
    if (!venda) {
      return res.status(404).json({ success: false, error: "Venda não encontrada" });
    }
    res.status(200).json({ success: true, data: venda });
  } catch (error) {
    next(error);
  }
});

// Criar venda e itens em transação
app.post("/vendas", async (req, res, next) => {
  const { clienteId, itens } = req.body;

  if (!clienteId || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ success: false, error: "Dados da venda inválidos" });
  }

  try {
    const totalVenda = itens.reduce((acc, item) => acc + item.subtotal, 0);

    const vendaCriada = await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.create({
        data: {
          clienteId,
          total: totalVenda,
          itens: {
            create: itens.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          cliente: true,
          itens: { include: { produto: true } },
        },
      });
      return venda;
    });

    res.status(201).json({ success: true, data: vendaCriada });
  } catch (error) {
    next(error);
  }
});

// Atualizar venda - simplificado (somente total e itens)
app.put("/vendas/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  const { clienteId, itens } = req.body;

  if (!clienteId || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ success: false, error: "Dados da venda inválidos" });
  }

  try {
    const vendaExistente = await prisma.venda.findUnique({ where: { id } });
    if (!vendaExistente) {
      return res.status(404).json({ success: false, error: "Venda não encontrada" });
    }

    const totalVenda = itens.reduce((acc, item) => acc + item.subtotal, 0);

    // Atualiza venda e recria itens
    await prisma.$transaction(async (tx) => {
      await tx.itemVenda.deleteMany({ where: { vendaId: id } });

      await tx.venda.update({
        where: { id },
        data: {
          clienteId,
          total: totalVenda,
          itens: {
            create: itens.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              subtotal: item.subtotal,
            })),
          },
        },
      });
    });

    const vendaAtualizada = await prisma.venda.findUnique({
      where: { id },
      include: { cliente: true, itens: { include: { produto: true } } },
    });

    res.status(200).json({ success: true, data: vendaAtualizada });
  } catch (error) {
    next(error);
  }
});

// Deletar venda
app.delete("/vendas/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const vendaExistente = await prisma.venda.findUnique({ where: { id } });
    if (!vendaExistente) {
      return res.status(404).json({ success: false, error: "Venda não encontrada" });
    }
    await prisma.$transaction(async (tx) => {
      await tx.itemVenda.deleteMany({ where: { vendaId: id } });
      await tx.venda.delete({ where: { id } });
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
