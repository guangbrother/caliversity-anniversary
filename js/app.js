(() => {
  const config = window.CALIVERSITY_CONFIG || {};
  const form = document.getElementById("item-form");
  const nameInput = document.getElementById("member-name");
  const itemInput = document.getElementById("item-name");
  const fileInput = document.getElementById("media-file");
  const uploadLabel = document.getElementById("upload-label");
  const filePreview = document.getElementById("file-preview");
  const statusBox = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-button");
  const postGrid = document.getElementById("post-grid");
  const postCount = document.getElementById("post-count");
  const sortSelect = document.getElementById("sort-posts");
  const toast = document.getElementById("toast");
  const MAX_IMAGE = 8 * 1024 * 1024;
  const MAX_VIDEO = 25 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
  const categories = ["Calisthenic gear", "Tech", "Food & Beverages", "Other(s)"];
  let supabase = null;
  let posts = [];

  const configured = config.supabaseUrl && config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_") && !config.supabaseAnonKey.includes("YOUR_") &&
    window.supabase?.createClient;

  if (configured) {
    supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    loadPosts();
    // Realtime is a convenience; initial load + manual refresh still work without it.
    supabase.channel("public-anniversary-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "anniversary_items" }, loadPosts)
      .subscribe();
  } else {
    postGrid.innerHTML = '<div class="empty-state"><strong>Connect your board</strong>Add your Supabase URL and anon key in <code>js/config.js</code>, then refresh this page.</div>';
    postCount.textContent = "Setup required";
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    filePreview.replaceChildren();
    if (!file) {
      uploadLabel.textContent = "Choose a file or drag it here";
      return;
    }
    uploadLabel.textContent = file.name;
    const error = validateFile(file);
    if (error) {
      setStatus(error, true);
      fileInput.value = "";
      uploadLabel.textContent = "Choose a file or drag it here";
      return;
    }
    const p = document.createElement("span");
    p.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    filePreview.append(p);
    filePreview.hidden = false;
    setStatus("");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase) {
      setStatus("The board is not connected yet. Follow the Supabase setup in README.md.", true);
      return;
    }
    const name = nameInput.value.trim();
    const item = itemInput.value.trim();
    const category = form.querySelector('input[name="category"]:checked')?.value || null;
    const file = fileInput.files[0] || null;
    if (!name || !item) return setStatus("Please enter your name and the item you're bringing.", true);
    if (name.length > 40 || item.length > 90) return setStatus("Please shorten your name or item description.", true);
    if (category && !categories.includes(category)) return setStatus("Please choose a valid category.", true);
    if (file) {
      const fileError = validateFile(file);
      if (fileError) return setStatus(fileError, true);
    }

    submitButton.disabled = true;
    submitButton.textContent = "Posting…";
    setStatus("Submitting your item…");
    try {
      let mediaUrl = null;
      let mediaType = null;
      if (file) {
        const extension = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
        const objectPath = `${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from(config.storageBucket)
          .upload(objectPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(config.storageBucket).getPublicUrl(objectPath);
        mediaUrl = data.publicUrl;
        mediaType = file.type.startsWith("video/") ? "video" : "image";
      }

      const { error: insertError } = await supabase.from("anniversary_items").insert({
        member_name: name, item_name: item, category, media_url: mediaUrl, media_type: mediaType
      });
      if (insertError) throw insertError;

      form.reset();
      filePreview.replaceChildren();
      filePreview.hidden = true;
      uploadLabel.textContent = "Choose a file or drag it here";
      setStatus("Your item is now on the community board. Thank you!", false, true);
      showToast("Your item has been posted!");
      await loadPosts();
      document.getElementById("showcase").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error(error);
      setStatus("Could not post your item. Please try again. " + (error.message || ""), true);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Post to community board <span aria-hidden="true">↗</span>';
    }
  });

  sortSelect.addEventListener("change", renderPosts);

  function validateFile(file) {
    if (!allowedTypes.includes(file.type)) return "Please choose a JPG, PNG, WEBP, MP4 or WEBM file.";
    const limit = file.type.startsWith("video/") ? MAX_VIDEO : MAX_IMAGE;
    if (file.size > limit) return `That file is too large. Maximum size: ${file.type.startsWith("video/") ? "25 MB" : "8 MB"}.`;
    return "";
  }

  async function loadPosts() {
    if (!supabase) return;
    const { data, error } = await supabase.from("anniversary_items")
      .select("id, member_name, item_name, category, media_url, media_type, created_at")
      .order("created_at", { ascending: false }).limit(150);
    if (error) {
      console.error(error);
      postGrid.innerHTML = '<div class="empty-state"><strong>Could not load posts</strong>Refresh the page or check the database setup.</div>';
      postCount.textContent = "Connection issue";
      return;
    }
    posts = data || [];
    renderPosts();
  }

  function renderPosts() {
    const sorted = [...posts].sort((a, b) => sortSelect.value === "oldest"
      ? new Date(a.created_at) - new Date(b.created_at)
      : new Date(b.created_at) - new Date(a.created_at));
    postCount.textContent = `${posts.length} ${posts.length === 1 ? "item" : "items"} shared`;
    postGrid.replaceChildren();
    if (!sorted.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const strong = document.createElement("strong");
      strong.textContent = "The board is waiting for its first post";
      empty.append(strong, document.createTextNode("Be the first to share what you're bringing!"));
      postGrid.append(empty);
      return;
    }
    sorted.forEach(post => postGrid.append(createPostCard(post)));
  }

  function createPostCard(post) {
    const card = document.createElement("article");
    card.className = "post-card";
    const media = document.createElement("div");
    media.className = "post-media";
    if (post.media_url && post.media_type === "image") {
      const img = document.createElement("img");
      img.src = post.media_url; img.alt = `Photo of ${post.item_name}`; img.loading = "lazy";
      media.append(img);
    } else if (post.media_url && post.media_type === "video") {
      const video = document.createElement("video");
      video.src = post.media_url; video.controls = true; video.preload = "metadata";
      video.setAttribute("aria-label", `Video of ${post.item_name}`);
      media.append(video);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "no-media"; placeholder.textContent = "C";
      media.append(placeholder);
    }
    const info = document.createElement("div"); info.className = "post-info";
    const member = document.createElement("div"); member.className = "post-name"; member.textContent = post.member_name;
    const item = document.createElement("div"); item.className = "post-item"; item.textContent = post.item_name;
    const meta = document.createElement("div"); meta.className = "post-meta";
    if (post.category) {
      const tag = document.createElement("span"); tag.className = "category-tag"; tag.textContent = post.category; meta.append(tag);
    }
    const date = document.createElement("span"); date.className = "post-date";
    date.textContent = new Date(post.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    meta.append(date); info.append(member, item, meta); card.append(media, info);
    return card;
  }

  function setStatus(message, isError = false, success = false) {
    statusBox.textContent = message;
    statusBox.className = "status" + (isError ? " error" : success ? " success" : "");
  }
  function showToast(message) {
    toast.textContent = message; toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2600);
  }
})();
