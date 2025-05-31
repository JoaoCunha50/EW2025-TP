# 🧠 I Am... (in Bits and Bytes) – O Meu Eu Digital

### Projeto Final – Engenharia Web 2025  
**Grupo:** 24 - PixelPulse

**Autores:** João Manuel Machado da Cunha (A104611) / João Pedro Ribeiro de Sá (A104612) / Gonçalo da Silva Alves (A104079)

**Data de Entrega:** 1 de Junho de 2025  

**Docente:** José Carlos Ramalho

**Nota:** ? / 20 ⭐

---

## 📝 Resumo
O projeto final da UC Engenharia Web consiste no desenvolvimento de uma aplicação Web. Esta aplicação representa o "eu digital" de um utilizador (tem o nome de Francisco Castro, escolhido pelo grupo), funcionando como um diário pessoal. A plataforma permite o registo, armazenamento, gestão e visualização de eventos/conteúdos tais como fotos, registos de texto, conquistas, atividades desportivas, de uma forma geral, o que o utilizador decidir colocar no seu diário.

A solução abrange:
- *Frontend* desenvolvida com PUG e estilizada com W3.CSS e CSS nativo, permitindo a navegação fluida pelos conteúdos públicos.
- *Backend* **(ver isto)**
- Sistema de ingestão, armazenamento e disseminação de conteúdos com base no modelo OAIS **(ver isto)**
- Persistência de dados em MongoDB e sistema de ficheiros **(ver isto)**

---

## 🎯 Objetivos

- Criar um repositório digital pessoal baseado no modelo **OAIS**.
- Permitir ingestão de pacotes SIP contendo conteúdos diversos.
- Armazenar e disponibilizar os conteúdos via AIP e DIP.
- Implementar autenticação tradicional e via redes sociais.
- Explorar tanto a navegação cronológica quanto por classificadores.

---

## 🔐 Autenticação

- Módulo Passport.js com:
  - Login tradicional (username + senha)
  - Login com Google
  - Login com Facebook

---

## 🚀 Deployment

```bash
# Inicialização com Docker Compose
docker-compose up --build
