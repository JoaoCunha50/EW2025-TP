const express = require("express");
const router = express.Router();
const axios = require("axios");
const isAdmin = require("../middleware/auth");
const { validTags } = require("../utils/utils");
const fs = require("fs");
const path = require("path");
const { getStatisticsForView } = require("../utils/logs");

router.get("/login", function (req, res) {
  res.clearCookie("token");
  res.render("adminLogin", { title: "Admin - Login" });
});

router.get("/users", isAdmin, async function (req, res) {
  try {
    const response = await axios.get("http://api:3000/api/users", {
      headers: {
        Authorization: `Bearer ${req.cookies.token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch data from API");
    }

    const users = response.data;
    res.render("users", { title: "Admin - Users", users: users });
  } catch (error) {
    console.error("Error:", error);
    return res.render("users", {
      title: "Admin - Users",
      error: "Failed to fetch data from API",
    });
  }
});

router.post("/users", isAdmin, async function (req, res) {
  try {
    const response = await axios.post("http://api:3000/api/users", req.body, {
      headers: {
        Authorization: `Bearer ${req.cookies.token}`,
      },
    });

    if (response.status === 200) {
      return res.redirect("/admin/users");
    } else {
      throw new Error("Failed to create user");
    }
  } catch (error) {
    console.error("Error:", error);
    return res.redirect("/admin/users");
  }
});

router.get("/users/delete/:id", isAdmin, async function (req, res) {
  try {
    const response = await axios.delete(
      `http://api:3000/api/users/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${req.cookies.token}`,
        },
      }
    );

    if (response.status === 200) {
      return res.redirect("/admin/users");
    } else {
      throw new Error("Failed to delete user");
    }
  } catch (error) {
    console.error("Error:", error);
    return res.render("users", {
      title: "Admin - Users",
      error: "Failed to delete user",
    });
  }
});

router.get("/", isAdmin, async function (req, res) {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${req.cookies.token}`,
      },
    };
    const [postsResponse, usersResponse] = await Promise.all([
      axios.get("http://api:3000/api/diary", config),
      axios.get("http://api:3000/api/users", config),
    ]);

    return res.render("adminDiario", {
      title: "Admin - Dashboard",
      posts: postsResponse.data,
      totalUsers: usersResponse.data.length,
      tags: validTags,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.render("adminDiario", {
      title: "Admin - Dashboard",
      posts: [],
      totalUsers: 0,
      error: "Failed to fetch data from API",
      tags: validTags,
    });
  }
});

router.get("/posts/add", isAdmin, function (req, res) {
  res.render("addPost", { title: "Add Post", tags: validTags });
});

router.get("/posts/:id", isAdmin, async function (req, res) {
  try {
    const email = req.cookies.email;
    const response = await axios.get(
      `http://api:3000/api/diary/${req.params.id}`
    );
    var post = response.data;
    return res.render("post", {
      title: "Post",
      post: post,
      isAdmin: true,
      authenticated: true,
      userEmail: email,
    });
  } catch (error) {
    console.error("Error: " + error);
    return res.redirect("/admin/diario");
  }
});

router.post("/login", async function (req, res, next) {
  try {
    const response = await axios.post("http://api:3000/auth/admin/login", {
      email: req.body.email,
      password: req.body.password,
    });

    if (response.data.token) {
      res.cookie("token", response.data.token, {
        httpOnly: true,
        secure: false,
      });

      return res.redirect("/admin");
    } else {
      return res.render("adminLogin", {
        title: "Login",
        error: "Authentication failed",
      });
    }
  } catch (error) {
    return res.render("adminLogin", {
      title: "Login",
      error: "Invalid credentials",
    });
  }
});

router.get("/logs", isAdmin, async function (req, res) {
  try {
    const logFilePath = path.join(__dirname, "../logs/app.log");

    fs.readFile(logFilePath, "utf8", (err, data) => {
      if (err) return res.status(500).send("Erro ao ler ficheiro de logs.");

      const lines = data.trim().split("\n");

      const logs = lines
        .map((line) => {
          try {
            const obj = JSON.parse(line);
            return obj.message;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      res.render("logList", { title: "Admin - Logs", logs });
    });
  } catch (error) {
    console.error("Error reading logs:", error);
    res.render("logList", {
      title: "Admin - Logs",
      error: "Failed to load logs",
      logs: [],
    });
  }
});

router.get("/logStats", isAdmin, async function (req, res) {
  try {
    const logFilePath = path.join(__dirname, "../logs/app.log");
    const postsReq = await axios.get(`http://api:3000/api/diary`);
    const posts = postsReq.data;

    fs.readFile(logFilePath, "utf8", (err, data) => {
      if (err) return res.status(500).send("Erro ao ler ficheiro de logs.");

      const lines = data.trim().split("\n");
      const logs = lines
        .map((line) => {
          try {
            const obj = JSON.parse(line);
            return obj.message;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      const statisticsData = getStatisticsForView(logs);

      const topPostsWithDetails = statisticsData.topPosts
        .map((topPost) => {
          const postDetails = posts.find(
        (post) => post._id === topPost.url.split("/posts/")[1]
          );

          if (!postDetails) return null;

          return {
        id: postDetails._id,
        title: postDetails.title,
        author: postDetails.producer,
        count: topPost.count,
          };
        })
        .filter(Boolean);

      const topDownloadsWithDetails = statisticsData.topDownloads
        .map((topDownload) => {
          const postId = topDownload.url;
          const downloadDetails = posts.find((post) => post._id === postId);

          if (!downloadDetails) return null;

          return {
        id: downloadDetails._id,
        title: downloadDetails.title,
        author: downloadDetails.producer,
        count: topDownload.count,
          };
        })
        .filter(Boolean);

      res.render("logStats", {
        title: "Admin - Logs",
        logs: logs,
        stats: statisticsData,
        topPosts: topPostsWithDetails,
        topDownloads : topDownloadsWithDetails,
      });
    });
  } catch (error) {
    console.error("Error reading logs:", error);
    res.render("logStats", {
      title: "Admin - Logs",
      error: "Failed to load logs",
      logs: [],
      stats: null,
    });
  }
});

module.exports = router;
