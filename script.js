const app = { activityLevel: 'sedentary', goal: 'maintain', recommended: 0, foods: [], total: 0 };

    // ── Toast ──────────────────────────────────────────────────────
    function toast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2800);
    }

    // ── Step nav ───────────────────────────────────────────────────
    function markStep(n) {
      for (let i = 1; i <= 3; i++) {
        const c = document.getElementById('sn' + i);
        if (i <= n) c.classList.add('done'); else c.classList.remove('done');
        if (i < 3) {
          const l = document.getElementById('sl' + i);
          if (i < n) l.classList.add('done'); else l.classList.remove('done');
        }
      }
    }

    // ── Selectors ──────────────────────────────────────────────────
    function pickAct(el) {
      document.querySelectorAll('.act-pill').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      app.activityLevel = el.dataset.act;
    }
    function pickGoal(el) {
      document.querySelectorAll('.goal-card').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      app.goal = el.dataset.goal;
    }

    // ── Step 1: Calculate ──────────────────────────────────────────
    async function calculateCalories() {
      const age = parseFloat(document.getElementById('age').value);
      const height = parseFloat(document.getElementById('height').value);
      const weight = parseFloat(document.getElementById('weight').value);
      const gender = document.getElementById('gender').value;
      const errEl = document.getElementById('calcErr');
      errEl.classList.remove('show');

      if ([age, height, weight].some(v => isNaN(v) || v <= 0)) {
        errEl.textContent = '⚠ Please enter valid Age, Height, and Weight.';
        errEl.classList.add('show');
        return;
      }

      try {
        let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
        let multiplier = 1.2;
        switch (app.activityLevel) {
          case 'light': multiplier = 1.375; break;
          case 'moderate': multiplier = 1.55; break;
          case 'veryactive': multiplier = 1.725; break;
          case 'athlete': multiplier = 1.9; break;
        }
        let maintenance = bmr * multiplier;
        let recommended = maintenance;
        let goalLabel = "Maintain";
        if (app.goal === 'lose') { recommended -= 400; goalLabel = "Lose Weight"; }
        if (app.goal === 'gain') { recommended += 400; goalLabel = "Gain Weight"; }

        const d = { bmr, maintenance, recommended, goalLabel };

        app.recommended = d.recommended;

        document.getElementById('rBMR').textContent = Math.round(d.bmr);
        document.getElementById('rMaint').textContent = Math.round(d.maintenance);
        document.getElementById('rRec').textContent = Math.round(d.recommended);
        document.getElementById('rGoalLbl').textContent = d.goalLabel;
        document.getElementById('resultRow').style.display = 'flex';
        document.getElementById('sumRec').value = Math.round(d.recommended);

        markStep(2);
        toast(`✅ ${d.goalLabel}: ${Math.round(d.recommended)} kcal / day`);
      } catch (e) {
        errEl.textContent = '⚠ An error occurred during calculation.';
        errEl.classList.add('show');
      }
    }

    // ── Step 2: Add Food ───────────────────────────────────────────
    async function addFood() {
      const foodName = document.getElementById('foodName').value.trim();
      const grams = parseFloat(document.getElementById('grams').value);
      const caloriesPer100g = parseFloat(document.getElementById('calPer100').value);
      const errEl = document.getElementById('foodErr');
      errEl.classList.remove('show');

      if (!foodName || isNaN(grams) || grams <= 0 || isNaN(caloriesPer100g) || caloriesPer100g <= 0) {
        errEl.textContent = '⚠ Please fill in all fields with valid values.';
        errEl.classList.add('show');
        return;
      }

      try {
        let calories = (grams * caloriesPer100g) / 100;
        const d = { foodName, grams, calories };

        app.foods.push({ name: d.foodName, grams: d.grams, calories: d.calories });
        app.total = app.foods.reduce((s, f) => s + f.calories, 0);
        renderFoods();
        document.getElementById('sumCons').value = app.total.toFixed(1);
        document.getElementById('foodName').value = '';
        document.getElementById('grams').value = '';
        document.getElementById('calPer100').value = '';
        markStep(2);
        toast(`🥗 ${d.foodName} added — ${d.calories.toFixed(0)} kcal`);
      } catch (e) {
        errEl.textContent = '⚠ An error occurred while adding food.';
        errEl.classList.add('show');
      }
    }

    function renderFoods() {
      const el = document.getElementById('foodList');
      const strip = document.getElementById('totalStrip');
      if (!app.foods.length) {
        el.innerHTML = '<div class="empty-state"><span class="es-icon">🥗</span><p>Nothing logged yet — start adding your meals above.</p></div>';
        strip.style.display = 'none';
        return;
      }
      el.innerHTML = app.foods.map((f, i) => `
      <div class="food-item">
        <div class="fi-left">
          <span class="fi-name">${f.name}</span>
          <span class="fi-grams">${f.grams}g</span>
        </div>
        <div class="fi-right">
          <span class="fi-cal">${f.calories.toFixed(0)} kcal</span>
          <button class="fi-del" onclick="removeFood(${i})" title="Remove">✕</button>
        </div>
      </div>`).join('');
      strip.style.display = 'flex';
      document.getElementById('totalVal').textContent = `${app.total.toFixed(1)} kcal`;
    }

    function removeFood(i) {
      const n = app.foods[i].name;
      app.foods.splice(i, 1);
      app.total = app.foods.reduce((s, f) => s + f.calories, 0);
      renderFoods();
      document.getElementById('sumCons').value = app.total.toFixed(1) || '';
      toast(`Removed ${n}`);
    }

    function clearFoods() {
      if (!app.foods.length) return;
      app.foods = []; app.total = 0;
      renderFoods();
      document.getElementById('sumCons').value = '';
      toast('🗑 Food log cleared');
    }

    // ── Step 3: Summary ────────────────────────────────────────────
    async function checkSummary() {
      const rec = parseFloat(document.getElementById('sumRec').value);
      const cons = parseFloat(document.getElementById('sumCons').value);
      const errEl = document.getElementById('sumErr');
      errEl.classList.remove('show');

      if (isNaN(rec) || rec <= 0) {
        errEl.textContent = '⚠ Complete Step 1 to set your recommended calories.';
        errEl.classList.add('show');
        return;
      }
      if (isNaN(cons)) {
        errEl.textContent = '⚠ Log some food in Step 2 first.';
        errEl.classList.add('show');
        return;
      }

      try {
        let remaining = rec - cons;
        let status = 'BALANCED';
        let suggestion = 'You are perfectly balanced today!';

        if (remaining > 200) {
          status = 'UNDER';
          suggestion = 'You still have plenty of calories left. Treat yourself!';
        } else if (remaining < -200) {
          status = 'OVER';
          suggestion = 'You went quite over today. Ensure a lighter meal tomorrow.';
        } else if (Math.abs(remaining) <= 200 && Math.abs(remaining) >= 50) {
          status = 'CLOSE';
          suggestion = 'You are very close to your goal. Maintain this rhythm.';
        }

        const d = { recommended: rec, consumed: cons, remaining, status, suggestion };
        renderSummary(d, rec, cons);
        markStep(3);
        toast('📊 Summary ready!');
      } catch (e) {
        errEl.textContent = '⚠ An error occurred while generating summary.';
        errEl.classList.add('show');
      }
    }

    const SUG_META = {
      UNDER: { cls: 'UNDER', icon: '🍗', title: 'Keep Going — Fuel Up!' },
      CLOSE: { cls: 'CLOSE', icon: '🍎', title: 'Almost There — Light Snack!' },
      BALANCED: { cls: 'BALANCED', icon: '✨', title: 'Perfectly Balanced Today!' },
      OVER: { cls: 'OVER', icon: '🥗', title: 'Over Goal — Go Light Tonight' },
    };

    function renderSummary(d, rec, cons) {
      document.getElementById('sRec').textContent = Math.round(d.recommended);
      document.getElementById('sCons').textContent = d.consumed.toFixed(0);

      const rem = d.remaining;
      const remEl = document.getElementById('sRem');
      const remTile = document.getElementById('sRemTile');
      remEl.textContent = Math.abs(rem).toFixed(0) + (rem < 0 ? ' over' : '');
      remTile.className = 'sum-tile st-rem' + (rem < -50 ? ' over' : '');

      // Progress bar
      const pct = Math.min((cons / rec) * 100, 110);
      const fill = document.getElementById('progFill');
      fill.style.width = Math.min(pct, 100) + '%';
      fill.className = 'prog-fill' + (rem < -50 ? ' over' : (Math.abs(rem) <= 50 ? ' balanced' : ''));
      document.getElementById('progGoalLbl').textContent = `Goal: ${Math.round(rec)} kcal`;

      // Suggestion box
      const m = SUG_META[d.status] || SUG_META['UNDER'];
      const box = document.getElementById('sugBox');
      box.className = `sug show ${m.cls}`;
      document.getElementById('sugIcon').textContent = m.icon;
      document.getElementById('sugTitle').textContent = m.title;
      document.getElementById('sugMsg').textContent = d.suggestion;

      document.getElementById('summaryOut').style.display = 'block';
    }
