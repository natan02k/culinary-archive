package com.example.starter;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.SessionHandler;
import io.vertx.ext.web.handler.StaticHandler;
import io.vertx.ext.web.handler.CorsHandler;
import io.vertx.ext.web.sstore.LocalSessionStore;
import io.vertx.mysqlclient.MySQLConnectOptions;
import io.vertx.mysqlclient.MySQLPool;
import io.vertx.sqlclient.PoolOptions;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.Tuple;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.FileUpload;
import io.vertx.core.http.HttpMethod;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import java.util.logging.Logger;
import java.time.LocalDate;
import java.io.File;

public class MainVerticle extends AbstractVerticle {

  private static final Logger LOGGER = Logger.getLogger(MainVerticle.class.getName());
  private MySQLPool client;

  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    new File("webroot/images/recipes").mkdirs();
    new File("webroot/images/profiles").mkdirs();

    // Daten aus Run-Configurations oder Fallbacks (wichtig damit es nicht abstürzt wenn env vars fehlen!)
    MySQLConnectOptions connectOptions = new MySQLConnectOptions()
          .setPort(10073)
          .setHost(System.getenv("DB_HOST") != null ? System.getenv("DB_HOST") : "127.0.0.1")
          .setDatabase(System.getenv("DB_NAME") != null ? System.getenv("DB_NAME") : "rezept_db")
          .setUser(System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root")
          .setPassword(System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : "1234");

    PoolOptions poolOptions = new PoolOptions().setMaxSize(5);

    client = MySQLPool.pool(vertx, connectOptions, poolOptions);

    Router router = Router.router(vertx);

    // CORS for Github Pages / Frontend
    router.route().handler(CorsHandler.create("http://localhost:3000|https://natan02k\\.github\\.io") // Must be exact origin for credentials, not .*
      .allowCredentials(true)
      .allowedMethod(HttpMethod.GET)
      .allowedMethod(HttpMethod.POST)
      .allowedMethod(HttpMethod.PUT)
      .allowedMethod(HttpMethod.DELETE)
      .allowedMethod(HttpMethod.OPTIONS)
      .allowedHeader("Access-Control-Allow-Method")
      .allowedHeader("Access-Control-Allow-Origin")
      .allowedHeader("Access-Control-Allow-Credentials")
      .allowedHeader("Access-Control-Allow-Headers")
      .allowedHeader("Content-Type"));

    router.route().handler(BodyHandler.create().setUploadsDirectory("webroot/images"));
    
    SessionHandler sessionHandler = SessionHandler.create(LocalSessionStore.create(vertx));
    sessionHandler.setCookieSameSite(io.vertx.core.http.CookieSameSite.LAX); // Lax prevents the browser dropping the cookie without Secure flag
    // sessionHandler.setCookieSecure(false) is not needed/doesn't exist in all Vert.x versions
    router.route().handler(sessionHandler);

    router.post("/api/login").handler(ctx -> {
      JsonObject body = ctx.getBodyAsJson();
      if (body == null || !body.containsKey("username") || !body.containsKey("password")) {
        ctx.response().setStatusCode(400).end(new JsonObject().put("error", "Ungültige Daten").encode());
        return;
      }

      String username = body.getString("username");
      String password = body.getString("password");

      client.preparedQuery("SELECT passwort FROM nutzer WHERE username = ?")
        .execute(Tuple.of(username))
        .onComplete(res -> {
          if (res.succeeded() && res.result().size() > 0) {
            String storedPassword = res.result().iterator().next().getString("passwort");
            if (password.equals(storedPassword)) {
              ctx.session().put("username", username);
              ctx.response().setStatusCode(200).end(new JsonObject().put("message", "Login erfolgreich").encode());
            } else {
              ctx.response().setStatusCode(401).end(new JsonObject().put("error", "Falsches Passwort").encode());
            }
          } else {
            ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Nutzer nicht gefunden").encode());
          }
        });
    });

    router.post("/api/logout").handler(ctx -> {
      if (ctx.session().get("username") != null) {
        ctx.session().destroy();
        ctx.response().setStatusCode(200).end(new JsonObject().put("message", "Logout erfolgreich").encode());
      } else {
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "Nicht eingeloggt").encode());
      }
    });

    router.post("/api/register").handler(ctx -> {
      JsonObject body = ctx.getBodyAsJson();
      if (body == null || !body.containsKey("username") || !body.containsKey("password") ||
        !body.containsKey("geburtsdatum") || !body.containsKey("email")) {
        ctx.response().setStatusCode(400).end(new JsonObject().put("error", "Ungültige Daten").encode());
        return;
      }

      String username = body.getString("username");
      String password = body.getString("password");
      String geburtsdatum = body.getString("geburtsdatum");
      String bio = body.getString("bio", "");
      String email = body.getString("email");

      client.preparedQuery("SELECT user_id FROM nutzer WHERE username = ? OR email = ?")
        .execute(Tuple.of(username, email))
        .onComplete(res -> {
          if (res.succeeded() && res.result().size() > 0) {
            ctx.response().setStatusCode(409).end(new JsonObject().put("error", "Nutzername oder Email bereits vergeben").encode());
          } else {
            client.preparedQuery("INSERT INTO nutzer (username, passwort, geburtsdatum, bio, email, xp, level) VALUES (?, ?, ?, ?, ?, 0, 1)")
              .execute(Tuple.of(username, password, geburtsdatum, bio, email))
              .onComplete(update -> {
                if (update.succeeded()) {
                  ctx.response().setStatusCode(201).end(new JsonObject().put("message", "Registrierung erfolgreich").encode());
                } else {
                  update.cause().printStackTrace();
                  ctx.response().setStatusCode(500).end(new JsonObject().put("error", "Fehler bei der Registrierung: " + update.cause().getMessage()).encode());
                }
              });
          }
        });
    });

    router.get("/api/check-login").handler(ctx -> {
      String username = ctx.session().get("username");
      if (username != null) {
        ctx.response().setStatusCode(200).end(new JsonObject().put("message", "Eingeloggt").put("username", username).encode());
      } else {
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "Nicht eingeloggt").encode());
      }
    });

    router.get("/api/profile").handler(ctx -> {
      String username = ctx.session().get("username");
      if (username == null) {
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "Nicht eingeloggt").encode());
        return;
      }

      client.preparedQuery("SELECT username, passwort, geburtsdatum, bio, email, xp, level, profile_image_url FROM nutzer WHERE username = ?")
        .execute(Tuple.of(username))
        .onComplete(res -> {
          if (res.succeeded() && res.result().size() > 0) {
            JsonObject userData = new JsonObject();
            Row row = res.result().iterator().next();
            userData.put("username", row.getString("username"));
            userData.put("geburtsdatum", row.getLocalDate("geburtsdatum") != null ? row.getLocalDate("geburtsdatum").toString() : null);
            userData.put("bio", row.getString("bio") != null ? row.getString("bio") : "");
            userData.put("email", row.getString("email"));
            userData.put("xp", row.getInteger("xp"));
            userData.put("level", row.getInteger("level"));
            userData.put("profile_image_url", row.getString("profile_image_url"));
            ctx.response().putHeader("Content-Type", "application/json").setStatusCode(200).end(userData.encode());
          } else {
            ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Nutzer nicht gefunden").encode());
          }
        });
    });

    router.post("/api/profile/image").handler(ctx -> {
      String username = ctx.session().get("username");
      if (username == null) {
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "Nicht eingeloggt").encode());
        return;
      }
      String imageUrl = handleUpload(ctx, "profiles", "profile_image");
      if (imageUrl != null) {
        client.preparedQuery("UPDATE nutzer SET profile_image_url = ? WHERE username = ?")
          .execute(Tuple.of(imageUrl, username))
          .onComplete(res -> {
            ctx.response().setStatusCode(200).end(new JsonObject().put("message", "Profilbild aktualisiert").put("url", imageUrl).encode());
          });
      } else {
        ctx.response().setStatusCode(400).end(new JsonObject().put("error", "Bild-Upload fehlgeschlagen").encode());
      }
    });

    router.get("/api/all-recipes").handler(ctx -> {
      String username = ctx.session().get("username");
      client.query("SELECT r.user_id, n.username as autor, r.titel, r.zubereitungszeit, r.kochzeit, r.schwierigkeit, r.zutaten, r.zubereitung, r.rezept_id, r.kategorie, r.tags, r.image_url " +
          "FROM rezept r JOIN nutzer n ON r.user_id = n.user_id ORDER BY r.rezept_id DESC")
        .execute()
        .onComplete(res -> {
          if (res.succeeded()) {
            JsonArray recipes = new JsonArray();
            for (Row row : res.result()) {
              recipes.add(new JsonObject()
                .put("rezept_id", row.getInteger("rezept_id"))
                .put("user_id", row.getInteger("user_id"))
                .put("autor", row.getString("autor"))
                .put("titel", row.getString("titel"))
                .put("zubereitungszeit", row.getInteger("zubereitungszeit"))
                .put("kochzeit", row.getInteger("kochzeit"))
                .put("schwierigkeit", row.getString("schwierigkeit"))
                .put("zutaten", row.getString("zutaten"))
                .put("zubereitung", row.getString("zubereitung"))
                .put("kategorie", row.getString("kategorie"))
                .put("tags", row.getString("tags") != null ? row.getString("tags") : "")
                .put("image_url", row.getString("image_url"))
                .put("is_favorite", false)
                .put("is_liked", false)
              );
            }
            if(username != null) {
              client.preparedQuery("SELECT user_id FROM nutzer WHERE username = ?").execute(Tuple.of(username), u -> {
                if(u.succeeded() && u.result().size() > 0) {
                     int userId = u.result().iterator().next().getInteger("user_id");
                     client.preparedQuery("SELECT rezept_id FROM favoriten WHERE user_id = ?").execute(Tuple.of(userId), favs -> {
                         if(favs.succeeded()) {
                             for(Row fav : favs.result()) {
                                 for(int i = 0; i < recipes.size(); i++) {
                                     if(recipes.getJsonObject(i).getInteger("rezept_id") == fav.getInteger("rezept_id")) {
                                         recipes.getJsonObject(i).put("is_favorite", true);
                                     }
                                 }
                             }
                             // Also fetch likes
                             client.preparedQuery("SELECT rezept_id FROM rezept_likes WHERE user_id = ?").execute(Tuple.of(userId), likes -> {
                                 if(likes.succeeded()) {
                                     for(Row l : likes.result()) {
                                         for(int i = 0; i < recipes.size(); i++) {
                                             if(recipes.getJsonObject(i).getInteger("rezept_id") == l.getInteger("rezept_id")) {
                                                 recipes.getJsonObject(i).put("is_liked", true);
                                             }
                                         }
                                     }
                                 }
                                 ctx.response().putHeader("Content-Type", "application/json").end(recipes.encode());
                             });
                         } else {
                             ctx.response().putHeader("Content-Type", "application/json").end(recipes.encode());
                         }
                     });
                } else {
                     ctx.response().putHeader("Content-Type", "application/json").end(recipes.encode());
                }
              });
            } else {
              ctx.response().putHeader("Content-Type", "application/json").end(recipes.encode());
            }
          } else {
            ctx.response().setStatusCode(500).end(new JsonObject().put("error", "Fehler").encode());
          }
        });
    });

    router.post("/api/recipes").handler(ctx -> {
      String username = ctx.session().get("username");
      if (username == null) {
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "Nicht eingeloggt").encode());
        return;
      }

      String titel = ctx.request().getFormAttribute("titel");
      String zubereitungszeitStr = ctx.request().getFormAttribute("zubereitungszeit");
      String kochzeitStr = ctx.request().getFormAttribute("kochzeit");
      String schwierigkeit = ctx.request().getFormAttribute("schwierigkeit");
      String zutaten = ctx.request().getFormAttribute("zutaten");
      String zubereitung = ctx.request().getFormAttribute("zubereitung");
      String kategorie = ctx.request().getFormAttribute("kategorie");
      String tags = ctx.request().getFormAttribute("tags");
      
      String imageUrl = handleUpload(ctx, "recipes", "image");
      if(imageUrl == null) imageUrl = "";
      final String finalImageUrl = imageUrl; // Make effectively final for lambda

      if (titel == null || zubereitungszeitStr == null || kochzeitStr == null || schwierigkeit == null || zutaten == null || zubereitung == null) {
        ctx.response().setStatusCode(400).end(new JsonObject().put("error", "Ungültige Daten").encode());
        return;
      }

      final Integer zs, ks;
      try {
        zs = Integer.parseInt(zubereitungszeitStr);
        ks = Integer.parseInt(kochzeitStr);
      } catch (NumberFormatException e) {
        ctx.response().setStatusCode(400).end(new JsonObject().put("error", "Zahlen ungültig").encode());
        return;
      }

      String validKategorie = kategorie != null ? kategorie : "Sonstiges";

      client.preparedQuery("SELECT user_id FROM nutzer WHERE username = ?")
        .execute(Tuple.of(username))
        .onComplete(res -> {
          if (res.succeeded() && res.result().size() > 0) {
            int userId = res.result().iterator().next().getInteger("user_id");
            client.preparedQuery("INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, zutaten, zubereitung, kategorie, tags, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
              .execute(Tuple.of(userId, titel, zs, ks, schwierigkeit, zutaten, zubereitung, validKategorie, tags != null ? tags : "", finalImageUrl))
              .onComplete(update -> {
                if (update.succeeded()) {
                  // GAMIFICATION: +50 XP for making a recipe
                  client.preparedQuery("UPDATE nutzer SET xp = xp + 50, level = FLOOR((xp + 50) / 100) + 1 WHERE user_id = ?")
                      .execute(Tuple.of(userId))
                      .onComplete(v -> {
                           ctx.response().setStatusCode(201).end(new JsonObject().put("message", "Rezept gespeichert, +50 XP!").encode());
                      });
                }
              });
          }
        });
    });

    router.post("/api/toggle-like").handler(ctx -> {
      String username = ctx.session().get("username");
      if (username == null) {
        ctx.response().setStatusCode(401).end(); return;
      }
      JsonObject body = ctx.getBodyAsJson();
      if(body == null) return;
      int rezeptId = body.getInteger("rezept_id");
      int action = body.getInteger("action"); // 1 for like, 0 for dislike

      client.preparedQuery("SELECT user_id FROM nutzer WHERE username = ?").execute(Tuple.of(username), res -> {
          if (res.succeeded() && res.result().size() > 0) {
              int userId = res.result().iterator().next().getInteger("user_id");
              client.preparedQuery("SELECT liked FROM rezept_likes WHERE user_id = ? AND rezept_id = ?").execute(Tuple.of(userId, rezeptId), statusRes -> {
                  if (statusRes.succeeded()) {
                      if (statusRes.result().size() > 0) {
                          Integer currentLiked = statusRes.result().iterator().next().getInteger("liked");
                          if (currentLiked != null && currentLiked == action) {
                              client.preparedQuery("DELETE FROM rezept_likes WHERE user_id=? AND rezept_id=?").execute(Tuple.of(userId, rezeptId));
                              ctx.response().setStatusCode(200).end(new JsonObject().put("message", "Removed").encode());
                          } else {
                              client.preparedQuery("UPDATE rezept_likes SET liked=? WHERE user_id=? AND rezept_id=?").execute(Tuple.of(action, userId, rezeptId));
                              ctx.response().setStatusCode(200).end(new JsonObject().put("message", "Updated").encode());
                          }
                      } else {
                          client.preparedQuery("INSERT INTO rezept_likes (rezept_id, user_id, liked) VALUES (?, ?, ?)").execute(Tuple.of(rezeptId, userId, action), ins -> {
                             // Award XP to recipe owner when LIKED
                             if(action == 1) {
                                 client.preparedQuery("UPDATE nutzer SET xp = xp + 10, level = FLOOR((xp+10) / 100) + 1 WHERE user_id = (SELECT user_id FROM rezept WHERE rezept_id = ?)")
                                     .execute(Tuple.of(rezeptId));
                             }
                             ctx.response().setStatusCode(201).end(new JsonObject().put("message", "Added").encode());
                          });
                      }
                  }
              });
          }
      });
    });

    router.get("/api/like-status/:recipeId").handler(ctx -> {
      String username = ctx.session().get("username");
      try {
          int recipeId = Integer.parseInt(ctx.pathParam("recipeId"));
          if(username != null) {
               client.preparedQuery("SELECT liked FROM rezept_likes WHERE user_id = (SELECT user_id FROM nutzer WHERE username = ?) AND rezept_id = ?")
                 .execute(Tuple.of(username, recipeId), res -> {
                    if(res.succeeded() && res.result().size() > 0) {
                        ctx.response().end(new JsonObject().put("liked", res.result().iterator().next().getInteger("liked")).encode());
                    } else {
                        ctx.response().end(new JsonObject().put("liked", (Integer)null).encode());
                    }
                 });
          } else {
              ctx.response().end(new JsonObject().put("liked", (Integer)null).encode());
          }
      }catch(Exception e) {}
    });

    router.get("/api/like-counts/:recipeId").handler(ctx -> {
      try {
          int recipeId = Integer.parseInt(ctx.pathParam("recipeId"));
          client.preparedQuery("SELECT SUM(CASE WHEN liked = 1 THEN 1 ELSE 0 END) as likes, SUM(CASE WHEN liked = 0 THEN 1 ELSE 0 END) as dislikes FROM rezept_likes WHERE rezept_id = ?")
            .execute(Tuple.of(recipeId), res -> {
                if(res.succeeded()) {
                    Row r = res.result().iterator().next();
                    ctx.response().end(new JsonObject().put("likes", r.getInteger("likes")!=null?r.getInteger("likes"):0).put("dislikes", r.getInteger("dislikes")).encode());
                }
            });
      }catch(Exception e) {}
    });

    // --- PHASE 2 ENDPOINTS ---
    
    // Edit Recipe
    router.put("/api/recipes/:id").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        try {
            int recipeId = Integer.parseInt(ctx.pathParam("id"));
            String title = ctx.request().getFormAttribute("titel");
            String prep = ctx.request().getFormAttribute("zubereitungszeit");
            String cook = ctx.request().getFormAttribute("kochzeit");
            String diff = ctx.request().getFormAttribute("schwierigkeit");
            String cat = ctx.request().getFormAttribute("kategorie");
            String tags = ctx.request().getFormAttribute("tags");
            String ing = ctx.request().getFormAttribute("zutaten");
            String steps = ctx.request().getFormAttribute("zubereitung");

            // Verify ownership first
            client.preparedQuery("SELECT * FROM rezept r JOIN nutzer n ON r.user_id = n.user_id WHERE n.username = ? AND r.rezept_id = ?")
                .execute(Tuple.of(username, recipeId), checkRes -> {
                    if (checkRes.succeeded() && checkRes.result().size() > 0) {
                        String removeImageFlag = ctx.request().getFormAttribute("remove_image");
                        boolean removeImage = "true".equals(removeImageFlag);
                        String imgUrl = handleUpload(ctx, "recipes", "image"); // Allow replacing image
                        
                        if (imgUrl == null) {
                            if (removeImage) {
                                client.preparedQuery("UPDATE rezept SET titel=?, zubereitungszeit=?, kochzeit=?, schwierigkeit=?, kategorie=?, tags=?, zutaten=?, zubereitung=?, image_url=NULL WHERE rezept_id=?")
                                      .execute(Tuple.of(title, prep, cook, diff, cat, tags != null ? tags : "", ing, steps, recipeId), res -> {
                                          if (res.succeeded()) ctx.response().setStatusCode(200).end();
                                          else ctx.response().setStatusCode(500).end();
                                      });
                            } else {
                                // Update without changing image
                                client.preparedQuery("UPDATE rezept SET titel=?, zubereitungszeit=?, kochzeit=?, schwierigkeit=?, kategorie=?, tags=?, zutaten=?, zubereitung=? WHERE rezept_id=?")
                                      .execute(Tuple.of(title, prep, cook, diff, cat, tags != null ? tags : "", ing, steps, recipeId), res -> {
                                          if (res.succeeded()) ctx.response().setStatusCode(200).end();
                                          else ctx.response().setStatusCode(500).end();
                                      });
                            }
                        } else {
                            client.preparedQuery("UPDATE rezept SET titel=?, zubereitungszeit=?, kochzeit=?, schwierigkeit=?, kategorie=?, tags=?, zutaten=?, zubereitung=?, image_url=? WHERE rezept_id=?")
                                  .execute(Tuple.of(title, prep, cook, diff, cat, tags != null ? tags : "", ing, steps, imgUrl, recipeId), res -> {
                                      if (res.succeeded()) ctx.response().setStatusCode(200).end();
                                      else ctx.response().setStatusCode(500).end();
                                  });
                        }
                    } else {
                        ctx.response().setStatusCode(403).end(); // Forbidden
                    }
                });
        } catch(Exception e) { ctx.response().setStatusCode(400).end(); }
    });

    // Delete Recipe
    router.delete("/api/recipes/:id").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        try {
            int recipeId = Integer.parseInt(ctx.pathParam("id"));
            client.preparedQuery("DELETE r FROM rezept r JOIN nutzer n ON r.user_id = n.user_id WHERE n.username = ? AND r.rezept_id = ?")
                .execute(Tuple.of(username, recipeId), res -> {
                    if (res.succeeded() && res.result().rowCount() > 0) ctx.response().setStatusCode(200).end();
                    else ctx.response().setStatusCode(403).end();
                });
        } catch(Exception e) { ctx.response().setStatusCode(400).end(); }
    });

    // Edit Profile (Bio / Email / Password / DOB)
    router.put("/api/profile").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        
        String bio = ctx.request().getFormAttribute("bio");
        String email = ctx.request().getFormAttribute("email");
        String passwort = ctx.request().getFormAttribute("passwort");
        String geburtsdatum = ctx.request().getFormAttribute("geburtsdatum");

        // Handle profile image upload if present in form replacing the old picture
        String imgUrl = handleUpload(ctx, "profiles", "profile_image");
        
        StringBuilder query = new StringBuilder("UPDATE nutzer SET ");
        List<Object> params = new ArrayList<>();
        
        if (bio != null) { query.append("bio=?, "); params.add(bio); }
        if (email != null) { query.append("email=?, "); params.add(email); }
        if (passwort != null && !passwort.trim().isEmpty()) { query.append("passwort=?, "); params.add(passwort); }
        if (geburtsdatum != null && !geburtsdatum.trim().isEmpty()) { query.append("geburtsdatum=?, "); params.add(geburtsdatum); }
        if (imgUrl != null && !imgUrl.isEmpty()) { query.append("profile_image_url=?, "); params.add(imgUrl); }
        
        // Remove trailing comma and space
        if (params.size() > 0) {
            query.setLength(query.length() - 2);
            query.append(" WHERE username=?");
            params.add(username);
            
            client.preparedQuery(query.toString()).execute(Tuple.from(params), res -> {
                if (res.succeeded()) ctx.response().setStatusCode(200).end();
                else ctx.response().setStatusCode(500).end();
            });
        } else {
            ctx.response().setStatusCode(200).end(); // Nothing to update
        }
    });

    // Delete Profile
    router.delete("/api/profile").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        
        client.preparedQuery("DELETE FROM nutzer WHERE username=?").execute(Tuple.of(username), res -> {
            if (res.succeeded()) {
                ctx.session().destroy();
                ctx.response().setStatusCode(200).end();
            } else ctx.response().setStatusCode(500).end();
        });
    });

    // Get Public Profile
    router.get("/api/profile/:username").handler(ctx -> {
        String targetUsername = ctx.pathParam("username");
        client.preparedQuery("SELECT username, bio, xp, level, profile_image_url FROM nutzer WHERE username=?").execute(Tuple.of(targetUsername), res -> {
            if (res.succeeded() && res.result().size() > 0) {
                Row row = res.result().iterator().next();
                JsonObject profile = new JsonObject();
                profile.put("username", row.getString("username"));
                profile.put("bio", row.getString("bio"));
                profile.put("xp", row.getInteger("xp"));
                profile.put("level", row.getInteger("level"));
                profile.put("profile_image_url", row.getString("profile_image_url"));
                ctx.response().putHeader("content-type", "application/json").end(profile.encode());
            } else {
                ctx.response().setStatusCode(404).end();
            }
        });
    });

    // Manage Favorites
    router.post("/api/favorites").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        JsonObject body = ctx.getBodyAsJson();
        if(body == null) { ctx.response().setStatusCode(400).end(); return; }
        int recipeId = body.getInteger("rezept_id");
        
        client.preparedQuery("INSERT IGNORE INTO favoriten (user_id, rezept_id) SELECT user_id, ? FROM nutzer WHERE username = ?")
              .execute(Tuple.of(recipeId, username), res -> {
                 if (res.succeeded()) ctx.response().setStatusCode(201).end();
                 else ctx.response().setStatusCode(500).end();
              });
    });

    router.delete("/api/favorites/:id").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        try {
            int recipeId = Integer.parseInt(ctx.pathParam("id"));
            client.preparedQuery("DELETE f FROM favoriten f JOIN nutzer n ON f.user_id = n.user_id WHERE n.username = ? AND f.rezept_id = ?")
                  .execute(Tuple.of(username, recipeId), res -> {
                      if (res.succeeded()) ctx.response().setStatusCode(200).end();
                      else ctx.response().setStatusCode(500).end();
                  });
        } catch(Exception e) { ctx.response().setStatusCode(400).end(); }
    });

    router.get("/api/favorites").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        client.preparedQuery("SELECT r.*, n.username as autor FROM favoriten f JOIN rezept r ON f.rezept_id = r.rezept_id JOIN nutzer n ON r.user_id = n.user_id JOIN nutzer active_user ON f.user_id = active_user.user_id WHERE active_user.username = ? ORDER BY r.rezept_id DESC")
              .execute(Tuple.of(username), res -> {
                  if (res.succeeded()) {
                      JsonArray arr = new JsonArray();
                      for (Row row : res.result()) arr.add(row.toJson());
                      ctx.response().putHeader("content-type", "application/json").end(arr.encode());
                  } else ctx.response().setStatusCode(500).end();
              });
    });

    // Comments
    router.post("/api/comments").handler(ctx -> {
        String username = ctx.session().get("username");
        if (username == null) { ctx.response().setStatusCode(401).end(); return; }
        JsonObject body = ctx.getBodyAsJson();
        int recipeId = body.getInteger("rezept_id");
        String text = body.getString("text");

        client.preparedQuery("INSERT INTO kommentare (rezept_id, user_id, text) SELECT ?, user_id, ? FROM nutzer WHERE username = ?")
              .execute(Tuple.of(recipeId, text, username), res -> {
                  if(res.succeeded()) ctx.response().setStatusCode(201).end();
                  else ctx.response().setStatusCode(500).end();
              });
    });

    router.get("/api/comments/:id").handler(ctx -> {
        try {
            int recipeId = Integer.parseInt(ctx.pathParam("id"));
            client.preparedQuery("SELECT k.text, k.datum, n.username, n.profile_image_url, n.level FROM kommentare k JOIN nutzer n ON k.user_id = n.user_id WHERE k.rezept_id = ? ORDER BY k.datum DESC")
                  .execute(Tuple.of(recipeId), res -> {
                      if (res.succeeded()) {
                          JsonArray arr = new JsonArray();
                          for (Row row : res.result()) arr.add(row.toJson());
                          ctx.response().putHeader("content-type", "application/json").end(arr.encode());
                      } else ctx.response().setStatusCode(500).end();
                  });
        } catch(Exception e) { ctx.response().setStatusCode(400).end(); }
    });

    router.route("/images/*").handler(StaticHandler.create("webroot/images")); // Expose images publicly
    router.route("/*").handler(StaticHandler.create("webroot"));

    int port = 8888;
    String envPort = System.getenv("PORT");
    if (envPort != null) {
      try {
        port = Integer.parseInt(envPort);
      } catch (NumberFormatException e) {
        LOGGER.warning("Invalid PORT env variable, defaulting to 8888");
      }
    }

    vertx.createHttpServer().requestHandler(router).listen(port, "0.0.0.0", http -> {
        if (http.succeeded()) LOGGER.info("HTTP server started on port " + http.result().actualPort() + "!");
        else LOGGER.severe("Failed to start HTTP Server");
    });
  }

  private String handleUpload(RoutingContext ctx, String dirName, String formName) {
    for (FileUpload file : ctx.fileUploads()) {
      if (file.name().equals(formName)) {
        if(file.size() > 5 * 1024 * 1024) return null; // <5MB check

        String original = file.fileName();
        String unique = UUID.randomUUID().toString() + original.substring(original.lastIndexOf("."));
        Path uploaded = Path.of(file.uploadedFileName());
        Path target = Path.of("webroot/images/" + dirName + "/" + unique);
        try {
          Files.move(uploaded, target, StandardCopyOption.REPLACE_EXISTING);
          return "images/" + dirName + "/" + unique;
        } catch (Exception e) {
          LOGGER.severe("Image Upload Error: " + e.getMessage());
        }
      }
    }
    return null;
  }
}
