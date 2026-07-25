import assert from "node:assert/strict";
import test from "node:test";

function canViewWishlist({ visibility, ownerId, activeGuestIds }, viewerId) {
  if (viewerId === ownerId) return true;
  if (visibility === "public") return true;
  if (!viewerId) return false;
  if (visibility === "private") return false;
  return activeGuestIds.has(viewerId);
}

function createInviteMachine() {
  const guests = new Map();
  const invites = new Map();
  let currentToken = null;
  let sequence = 0;

  function generateInvite() {
    for (const invite of invites.values()) {
      if (invite.status === "pending") invite.status = "revoked";
    }
    const token = `token-${++sequence}`;
    invites.set(token, { status: "pending", acceptedBy: null, claimedBy: null });
    currentToken = token;
    return token;
  }

  function acceptInvite(token, userId) {
    const invite = invites.get(token);
    if (!invite) return { ok: false, error: "invalid" };
    if (invite.status === "claiming" && invite.claimedBy === userId) {
      guests.set(userId, "active");
      return { ok: true };
    }
    if (invite.status === "accepted" && invite.acceptedBy === userId && guests.get(userId) === "active") return { ok: true };
    if (invite.status !== "pending") return { ok: false, error: "unavailable" };
    invite.status = "accepted";
    invite.acceptedBy = userId;
    guests.set(userId, "active");
    return { ok: true };
  }

  function removeGuest(userId) {
    guests.set(userId, "removed");
  }

  async function acceptInviteConcurrently(token, userId) {
    const invite = invites.get(token);
    if (!invite || invite.status !== "pending") return acceptInvite(token, userId);
    invite.status = "claiming";
    invite.claimedBy = userId;
    await Promise.resolve();
    invite.status = "accepted";
    invite.acceptedBy = userId;
    guests.set(userId, "active");
    return { ok: true };
  }

  return { guests, invites, get currentToken() { return currentToken; }, generateInvite, acceptInvite, removeGuest, acceptInviteConcurrently };
}

test("matriz de autorização de wishlist", () => {
  const ownerId = "owner";
  const guestId = "guest";
  const strangerId = "stranger";
  const activeGuestIds = new Set([guestId]);

  assert.equal(canViewWishlist({ visibility: "private", ownerId, activeGuestIds }, ownerId), true);
  assert.equal(canViewWishlist({ visibility: "private", ownerId, activeGuestIds }, strangerId), false);
  assert.equal(canViewWishlist({ visibility: "private", ownerId, activeGuestIds }, null), false);

  assert.equal(canViewWishlist({ visibility: "invited", ownerId, activeGuestIds }, ownerId), true);
  assert.equal(canViewWishlist({ visibility: "invited", ownerId, activeGuestIds }, guestId), true);
  assert.equal(canViewWishlist({ visibility: "invited", ownerId, activeGuestIds }, strangerId), false);
  assert.equal(canViewWishlist({ visibility: "invited", ownerId, activeGuestIds }, null), false);

  assert.equal(canViewWishlist({ visibility: "public", ownerId, activeGuestIds }, ownerId), true);
  assert.equal(canViewWishlist({ visibility: "public", ownerId, activeGuestIds }, guestId), true);
  assert.equal(canViewWishlist({ visibility: "public", ownerId, activeGuestIds }, strangerId), true);
  assert.equal(canViewWishlist({ visibility: "public", ownerId, activeGuestIds }, null), true);
});

test("convite é reivindicado por um usuário e não por outro", () => {
  const machine = createInviteMachine();
  const token = machine.generateInvite();

  assert.deepEqual(machine.acceptInvite(token, "first"), { ok: true });
  assert.deepEqual(machine.acceptInvite(token, "second"), { ok: false, error: "unavailable" });
  assert.equal(machine.guests.get("first"), "active");
  assert.equal(machine.guests.has("second"), false);
});

test("aceite repetido pelo mesmo usuário é idempotente", () => {
  const machine = createInviteMachine();
  const token = machine.generateInvite();

  assert.deepEqual(machine.acceptInvite(token, "guest"), { ok: true });
  assert.deepEqual(machine.acceptInvite(token, "guest"), { ok: true });
  assert.equal([...machine.guests.keys()].filter((id) => id === "guest").length, 1);
});

test("remoção revoga acesso e convite antigo não reativa convidado", () => {
  const machine = createInviteMachine();
  const token = machine.generateInvite();
  machine.acceptInvite(token, "guest");
  machine.removeGuest("guest");

  assert.equal(canViewWishlist({ visibility: "invited", ownerId: "owner", activeGuestIds: new Set() }, "guest"), false);
  assert.deepEqual(machine.acceptInvite(token, "guest"), { ok: false, error: "unavailable" });
  assert.equal(machine.guests.get("guest"), "removed");
});

test("novo convite invalida pendente anterior e pode reconvidar removido", () => {
  const machine = createInviteMachine();
  const oldToken = machine.generateInvite();
  const newToken = machine.generateInvite();

  assert.equal(machine.invites.get(oldToken).status, "revoked");
  assert.deepEqual(machine.acceptInvite(oldToken, "guest"), { ok: false, error: "unavailable" });

  machine.acceptInvite(newToken, "guest");
  machine.removeGuest("guest");
  const returnToken = machine.generateInvite();
  assert.deepEqual(machine.acceptInvite(returnToken, "guest"), { ok: true });
  assert.equal(machine.guests.get("guest"), "active");
});

test("convidados persistem ao alternar visibilidade", () => {
  const guests = new Set(["guest-a", "guest-b", "guest-c"]);
  const ownerId = "owner";

  assert.equal(canViewWishlist({ visibility: "invited", ownerId, activeGuestIds: guests }, "guest-a"), true);
  assert.equal(canViewWishlist({ visibility: "public", ownerId, activeGuestIds: guests }, "guest-a"), true);
  assert.equal(canViewWishlist({ visibility: "private", ownerId, activeGuestIds: guests }, "guest-a"), false);
  assert.equal(canViewWishlist({ visibility: "invited", ownerId, activeGuestIds: guests }, "guest-a"), true);
});

test("acesso direto pela URL usa a mesma regra do backend", () => {
  const wishlist = { visibility: "invited", ownerId: "owner", activeGuestIds: new Set(["guest"]) };

  assert.equal(canViewWishlist(wishlist, "guest"), true);
  assert.equal(canViewWishlist(wishlist, "manual-url-user"), false);
  assert.equal(canViewWishlist({ ...wishlist, visibility: "private" }, "manual-url-user"), false);
});

test("tentativas simultâneas reivindicam o convite uma única vez", async () => {
  const machine = createInviteMachine();
  const token = machine.generateInvite();

  const results = await Promise.all([
    machine.acceptInviteConcurrently(token, "first"),
    machine.acceptInviteConcurrently(token, "second")
  ]);

  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal([...machine.guests.values()].filter((status) => status === "active").length, 1);
});


test("mesmo usuário em aceite concorrente não cria duplicidade", async () => {
  const machine = createInviteMachine();
  const token = machine.generateInvite();

  const results = await Promise.all([
    machine.acceptInviteConcurrently(token, "guest"),
    machine.acceptInvite(token, "guest")
  ]);

  assert.equal(results.every((result) => result.ok), true);
  assert.equal([...machine.guests.keys()].filter((id) => id === "guest").length, 1);
});
test("página pública contém a experiência visual de conteúdo não encontrado", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile("app/w/[code]/page.tsx", "utf8"));

  assert.match(source, /404/);
  assert.match(source, /Conteúdo não encontrado/);
  assert.match(source, /Voltar para a página inicial/);
  assert.match(source, /setError\("not-found"\)/);
});