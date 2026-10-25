document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. GLOBAL STATE & NAVIGATION
       ========================================= */
    const state = {
        user: { loggedIn: false, name: '' },
        booking: {
            train: '',
            date: '',
            passengers: [],
            price: 1250,
            pnr: ''
        }
    };

    // Navigation Mapping
    const navLinks = {
        'seat-view-nav': 'seat-view-section',
        'smart-book-nav': 'smart-book-section',
        'cancel-nav': 'cancel-section'
    };

    function showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(el => {
            el.classList.add('hidden');
            el.style.opacity = '0';
        });

        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.remove('hidden');
            setTimeout(() => { target.style.opacity = '1'; }, 50);
        } else {
            // Default Home
            const home = document.getElementById('home-dashboard');
            home.classList.remove('hidden');
            setTimeout(() => { home.style.opacity = '1'; }, 50);
        }
    }

    // Nav Click Listeners
    Object.keys(navLinks).forEach(navId => {
        document.getElementById(navId).addEventListener('click', () => showSection(navLinks[navId]));
    });
    document.querySelector('.logo').addEventListener('click', () => showSection('home-dashboard'));


    /* =========================================
       2. NETWORK LATENCY SIMULATION (UX)
       ========================================= */
    function measureNetwork() {
        // Varies between 15ms (Fast) to 120ms (Slow)
        const latency = Math.floor(Math.random() * 80) + 15;
        const display = document.getElementById('latency-ms');
        const text = document.getElementById('network-text');
        const dot = document.querySelector('.status-dot');

        if (display) display.textContent = `${latency} ms`;

        if (latency < 40) {
            text.textContent = "Excellent Connection (Tatkal Ready)";
            dot.style.backgroundColor = "var(--success-green)";
            dot.style.boxShadow = "0 0 8px var(--success-green)";
        } else if (latency < 100) {
            text.textContent = "Stable Connection";
            dot.style.backgroundColor = "var(--warning-yellow)";
            dot.style.boxShadow = "none";
        } else {
            text.textContent = "Weak Signal - Using Lite Mode";
            dot.style.backgroundColor = "var(--error-red)";
        }
    }
    // Update every 4 seconds
    setInterval(measureNetwork, 4000);
    measureNetwork();


    /* =========================================
       3. SMART LOGIN (NO CAPTCHA)
       ========================================= */
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-nav');
    const closeLogin = document.querySelector('.close-btn');

    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('visible');
    });

    closeLogin.addEventListener('click', () => {
        loginModal.classList.remove('visible');
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const spinner = btn.querySelector('.spinner');
        const text = btn.querySelector('span');

        // UI Feedback
        text.style.display = 'none';
        spinner.classList.remove('hidden');
        btn.disabled = true;

        // Simulated Async Auth
        setTimeout(() => {
            state.user.loggedIn = true;
            state.user.name = document.getElementById('login-name').value || 'User';

            // Success State
            spinner.classList.add('hidden');
            text.style.display = 'block';
            text.innerHTML = '<i class="fa-solid fa-check"></i> Verified';
            document.getElementById('login-alert').classList.remove('hidden');

            // Close Modal & Update Nav
            setTimeout(() => {
                loginModal.classList.remove('visible');
                document.getElementById('login-nav').innerHTML = `
                    <span class="nav-link" style="color:var(--success-green); font-weight:700;">
                        <i class="fa-solid fa-circle-user"></i> ${state.user.name}
                    </span>`;
            }, 1200);
        }, 1500);
    });


    /* =========================================
       4. 3D SEAT VIEW LOGIC
       ========================================= */
    const coachFloor = document.querySelector('.coach-floor');

    document.getElementById('seat-view-nav').addEventListener('click', () => {
        if (coachFloor.children.length === 0) initSeats();
    });

    function initSeats() {
        coachFloor.innerHTML = '';
        // Generate 72 seats (Standard Coach with Aisle)
        for (let i = 1; i <= 72; i++) {
            const seat = document.createElement('div');
            seat.className = 'seat available';
            seat.title = `Seat ${i}`; // Tooltip
            seat.textContent = i; // Visible Number

            // Stylize text
            seat.style.display = 'flex';
            seat.style.justifyContent = 'center';
            seat.style.alignItems = 'center';
            seat.style.fontSize = '0.7rem';
            seat.style.color = 'rgba(0,0,0,0.5)';
            seat.style.fontWeight = '700';

            // Randomly mark booked
            if (Math.random() > 0.7) {
                seat.classList.add('booked');
                seat.textContent = ''; // Hide number if booked
            }

            seat.addEventListener('click', () => {
                if (seat.classList.contains('booked')) return;

                // Solo Mode Check
                const isSolo = document.getElementById('solo-mode-toggle')?.checked;
                if (isSolo) {
                    document.querySelectorAll('.seat.selected').forEach(s => {
                        if (s !== seat) s.classList.remove('selected');
                    });
                }

                // Multi-Select Mode (Default) or Toggle for Solo
                seat.classList.toggle('selected');
                updateSeatCalc();
            });

            // Double click to "Book ONLY This Seat"
            seat.addEventListener('dblclick', () => {
                if (seat.classList.contains('booked')) return;

                // Exclusive Selection: Clear others
                document.querySelectorAll('.seat.selected').forEach(s => {
                    s.classList.remove('selected');
                });

                // Select this one
                seat.classList.add('selected');

                updateSeatCalc();
                proceedToBooking();
            });

            coachFloor.appendChild(seat);
        }
    }

    function updateSeatCalc() {
        const selected = document.querySelectorAll('.seat.selected');
        const count = selected.length;
        document.getElementById('seat-count').textContent = count;
        // Calculate total price (1250 per seat)
        document.getElementById('total-price').textContent = count * 1250;

        const btn = document.getElementById('confirm-seat-btn');
        btn.disabled = count === 0;

        if (count > 0) {
            btn.style.opacity = '1';
            const totalPrice = count * 1250;

            if (count === 1) {
                // Show specific seat number for single selection
                btn.innerHTML = `Book Seat ${selected[0].textContent} (₹${totalPrice}) <i class="fa-solid fa-arrow-right"></i>`;
            } else {
                // Show count for multiple selection
                btn.innerHTML = `Book ${count} Seats (₹${totalPrice}) <i class="fa-solid fa-arrow-right"></i>`;
            }
        } else {
            btn.style.opacity = '0.7';
            btn.innerHTML = `Select Seats <i class="fa-solid fa-arrow-right"></i>`;
        }
    }

    // Link "Proceed" to Smart Book Wizard
    document.getElementById('confirm-seat-btn').addEventListener('click', proceedToBooking);

    function proceedToBooking() {
        const selected = document.querySelectorAll('.seat.selected');
        if (selected.length === 0) return;

        // Collect Seat Numbers
        const seatNums = Array.from(selected).map(s => s.title.replace('Seat ', ''));
        state.booking.seats = seatNums;

        // Transition
        showSection('smart-book-section');

        // Skip straight to Step 3 (Details)
        // We assume Step 1 (Train) and Step 2 (Date) are "implicit" or we set defaults
        if (!state.booking.train) state.booking.train = "12951 - Rajdhani Express (Selected via 3D)";
        if (!document.getElementById('book-date').value) {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('book-date').value = today;
        }

        // Smart Router: 
        // If we already have a Train AND Date (likely came from Wizard), go back to Step 3 (Details)
        // Else, start fresh at Step 1
        if (state.booking.train && state.booking.date) {
            goToStep(3);
        } else {
            // Default/Fresh Start
            goToStep(1);
        }
    }


    /* =========================================
       5. SMART BOOKING WIZARD & PAYMENT
       ========================================= */

    // -- Wizard Navigation --
    window.wizardNext = function () {
        const activeStep = document.querySelector('.wizard-step.active');
        const currentId = parseInt(activeStep.dataset.step);
        const nextId = currentId + 1;

        // Simple validation
        if (currentId === 2) {
            const dateVal = document.getElementById('book-date').value;
            if (!dateVal) {
                alert("Please select a date for your journey.");
                return;
            }
            // Save Date to State
            state.booking.date = dateVal;
        }

        goToStep(nextId);

        // Pre-fill review if reaching step 4
        if (nextId === 4) {
            document.getElementById('review-train').textContent = state.booking.train;
            document.getElementById('review-time').textContent = state.booking.time || "16:30";
            document.getElementById('review-date').textContent = state.booking.date || document.getElementById('book-date').value;

            // Collect All Passenger Names
            const nameInputs = document.querySelectorAll('.p-name-input');
            const names = Array.from(nameInputs).map(input => input.value || "Guest").join(', ');
            document.getElementById('review-name').textContent = names;

            // Update Total Price based on Seat Count
            const seatCount = (state.booking.seats && state.booking.seats.length) ? state.booking.seats.length : 1;
            const totalPrice = seatCount * 1250;
            document.getElementById('review-total').textContent = totalPrice.toLocaleString();

            // Update Seat Display in Review (Just Numbers)
            const seatReviewEl = document.getElementById('review-seats');
            if (state.booking.seats && state.booking.seats.length > 0) {
                seatReviewEl.textContent = state.booking.seats.join(', ');
            } else {
                seatReviewEl.textContent = seatCount > 1 ? `${seatCount} Seats (Unassigned)` : "Any/Unassigned";
            }

            // Update Pay Button Text too
            const payBtn = document.querySelector('.wizard-step[data-step="4"] + .wizard-step #pay-wallet-btn');
            if (payBtn) payBtn.innerHTML = `Pay ₹${totalPrice.toLocaleString()} via Wallet`;
        }
    };

    // Map Button Listener (from Step 3)
    const mapBtn = document.getElementById('open-map-btn');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            showSection('seat-view-section');
            // We are now in 3D view. When user clicks "Book X Seats", proceedToBooking() is called.
        });
    }

    function goToStep(stepNum) {
        // Hide all
        document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
        // Show target
        const target = document.querySelector(`.wizard-step[data-step="${stepNum}"]`);
        if (target) target.classList.add('active');

        // Update Progress Bar
        const percent = ((stepNum - 1) / 4) * 100;
        document.getElementById('booking-fill').style.width = `${percent}%`;

        // Update Indicators
        document.querySelectorAll('.step').forEach(s => {
            const sId = parseInt(s.dataset.step);
            s.classList.remove('active', 'completed');
            if (sId === stepNum) s.classList.add('active');
            if (sId < stepNum) s.classList.add('completed');
        });

        // Step 3: Dynamic Passenger Forms
        if (stepNum === 3) {
            const container = document.getElementById('passenger-list');
            const seatMsg = document.getElementById('seat-confirm-msg');
            const seatVal = document.getElementById('assigned-seat-display');

            // Provide feedback on seats
            if (state.booking.seats && state.booking.seats.length > 0) {
                seatMsg.classList.remove('hidden');
                seatVal.textContent = state.booking.seats.join(', ');
            } else {
                seatMsg.classList.add('hidden');
            }

            // Generate Forms
            container.innerHTML = '';
            const count = (state.booking.seats && state.booking.seats.length) ? state.booking.seats.length : 1;

            for (let i = 0; i < count; i++) {
                const seatLabel = (state.booking.seats && state.booking.seats[i]) ? `<span style="color:var(--success-green); font-size:0.85rem; margin-left:10px;"><i class="fa-solid fa-chair"></i> Seat ${state.booking.seats[i]}</span>` : '';

                const html = `
                <div class="passenger-card" style="background:#FAFAFA; padding:15px; border-radius:8px; border:1px solid #EEE; margin-bottom:15px;">
                    <h4 style="margin-bottom:10px; color:var(--primary-blue); display:flex; align-items:center;">
                        Passenger ${i + 1} ${seatLabel}
                    </h4>
                    <div class="input-group">
                        <label>Full Name</label>
                        <input type="text" class="p-name-input" placeholder="e.g. Rahul Sharma" value="${i === 0 ? 'Rahul Sharma' : ''}" required>
                    </div>
                    <div class="input-group">
                        <label>Age</label>
                        <input type="number" class="p-age-input" placeholder="Age" value="${i === 0 ? '28' : ''}" required>
                    </div>
                    <!-- Only show preference if no seat selected -->
                    ${!seatLabel ? `
                    <div class="input-group">
                        <label>Preference</label>
                        <select class="p-pref-input" style="width:100%; padding:0.8rem; border-radius:4px; border:1px solid #ddd;">
                            <option value="none">No Preference</option>
                            <option value="window">Window</option>
                            <option value="aisle">Aisle</option>
                        </select>
                    </div>` : ''}
                </div>`;
                container.innerHTML += html;
            }
        }
    }

    // -- Train Selection --
    // Dummy Data
    const trains = [
        { name: "12951 - Rajdhani Express", from: "New Delhi", time: "16:30", dur: "16h 05m" },
        { name: "22436 - Vande Bharat", from: "New Delhi", time: "06:00", dur: "08h 00m" },
        { name: "12002 - Shatabdi Express", from: "New Delhi", time: "06:15", dur: "06h 15m" }
    ];

    const listContainer = document.getElementById('smart-train-list');
    let listHtml = '';
    trains.forEach(t => {
        listHtml += `
        <div class="train-item" onclick="selectTrain('${t.name}', '${t.time}')">
            <div>
                <div style="font-weight:700; color:var(--primary-blue); font-size:1.1rem;">${t.name}</div>
                <div style="font-size:0.85rem; color:#666; margin-top:4px;">
                    <i class="fa-regular fa-clock"></i> ${t.time} • Duration: ${t.dur}
                </div>
            </div>
            <div style="text-align:right;">
                <span style="color:var(--success-green); font-weight:700; font-size:0.9rem;">
                    AVL <span style="background:#E8F5E9; padding:2px 6px; border-radius:4px;">142</span>
                </span>
            </div>
        </div>`;
    });
    listContainer.innerHTML = listHtml;

    window.selectTrain = function (name, time) {
        state.booking.train = name;
        state.booking.time = time;
        goToStep(2); // Go to Date
    };

    /* =========================================
       6. PAYMENT PROCESSOR (THE FIX)
       ========================================= */

    // Function exposed to HTML onclicks
    window.processPayment = function (method) {
        // 1. Show Overlay
        const overlay = document.getElementById('payment-overlay');
        overlay.classList.add('active');

        // 2. Animate Steps
        const steps = {
            bank: document.getElementById('step-bank'),
            irctc: document.getElementById('step-irctc'),
            title: document.getElementById('pay-status-title')
        };

        let delay = 1000;
        if (method === 'wallet') delay = 500; // Faster for wallet

        // Custom Message for Split Pay
        if (method === 'split') {
            steps.bank.innerHTML = '<i class="fa-solid fa-link"></i> Generating Payment Link...';
            delay = 1500;
        } else {
            steps.bank.innerHTML = '<i class="fa-solid fa-check"></i> Merchant Verified';
        }

        setTimeout(() => {
            steps.bank.classList.add('active');
            if (method !== 'split') {
                steps.bank.innerHTML = '<i class="fa-solid fa-check"></i> Merchant Verified';
            } else {
                steps.bank.innerHTML = '<i class="fa-solid fa-check"></i> Link Sent to Passengers';
            }
            steps.bank.classList.add('completed');
        }, delay);

        setTimeout(() => {
            steps.irctc.classList.add('active');
            steps.irctc.innerHTML = '<i class="fa-solid fa-database"></i> Allocating Seat...';

            // Generate PNR
            state.booking.pnr = Math.floor(Math.random() * 9000000000) + 1000000000;
        }, delay + 1500);

        setTimeout(() => {
            steps.irctc.innerHTML = '<i class="fa-solid fa-check"></i> Seat Confirmed';
            steps.irctc.classList.add('completed');

            // Hide Overlay
            overlay.classList.remove('active');

            // Show Success Screen
            showSuccessScreen();
        }, delay + 3000);
    };

    function showSuccessScreen() {
        const screen = document.getElementById('booking-success');
        screen.classList.add('active');

        // Populate Data
        document.getElementById('final-pnr').textContent = state.booking.pnr;
        document.getElementById('final-train').textContent = state.booking.train;
        document.getElementById('final-passengers').textContent = `${document.getElementById('p-name').value} (Confirmed)`;

        // Fire Confetti (CSS/JS Trick or simple visual)
        // For now, the CSS animation handles the "reveal"
    }


    /* =========================================
       7. BOOK BY DISTANCE & TATKAL LOGIC
       ========================================= */

    function initDistancePanel() {
        const panel = document.getElementById('distance-panel');
        if (!panel) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTime = currentHour + (currentMin / 60);

        // Configuration for Booking Rules
        const rules = [
            {
                label: "0 – 100 km",
                open: 8, close: 10, // 8:00 AM - 10:00 AM
                icon: "fa-train-subway"
            },
            {
                label: "101 – 300 km",
                open: 10, close: 12, // 10:00 AM - 12:00 PM
                icon: "fa-train"
            },
            {
                label: "301 – 700 km",
                open: 12, close: 15, // 12:00 PM - 3:00 PM
                icon: "fa-train-tram"
            },
            {
                label: "700+ km",
                open: 15, close: 19, // 3:00 PM - 7:00 PM
                icon: "fa-route"
            },
            {
                label: "Tatkal (AC Classes)",
                open: 10, close: 10.25, // 10:00 AM - 10:15 AM
                icon: "fa-snowflake",
                isTatkal: true
            },
            {
                label: "Tatkal (Non-AC)",
                open: 11, close: 11.25, // 11:00 AM - 11:15 AM
                icon: "fa-wind",
                isTatkal: true
            }
        ];

        let html = `
            <h4 style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <i class="fa-solid fa-clock"></i> Booking Windows
            </h4>
        `;

        rules.forEach(rule => {
            const isOpen = currentTime >= rule.open && currentTime < rule.close;
            const statusClass = isOpen ? 'status-open' : 'status-closed';
            const statusText = isOpen ? 'OPEN NOW' : 'CLOSED';

            // Format times for display (e.g., 8 -> 08:00, 23.5 -> 23:30)
            const formatTime = (t) => {
                const h = Math.floor(t);
                const m = Math.round((t - h) * 60);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            };

            html += `
            <div class="distance-row">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid ${rule.icon}" style="color:var(--primary-blue); font-size:0.9rem; width:20px;"></i>
                    <div>
                        <div style="font-weight:600; font-size:0.9rem;">${rule.label}</div>
                        <div style="font-size:0.75rem; color:#666;">
                            ${formatTime(rule.open)} - ${formatTime(rule.close)}
                        </div>
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            `;
        });

        // Add a "Current Server Time" footer
        html += `
            <div style="margin-top:15px; font-size:0.75rem; color:#888; text-align:center; background:#f5f5f5; padding:5px; border-radius:4px;">
                <i class="fa-regular fa-clock"></i> Server Time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        `;

        panel.innerHTML = html;
    }

    // Initialize and update every minute
    initDistancePanel();
    setInterval(initDistancePanel, 60000);

    /* =========================================
       7. CANCELLATION & REFUNDS
       ========================================= */

    window.searchPNR = function () {
        const input = document.getElementById('cancel-pnr-input').value;
        if (!input || input.length < 5) {
            alert("Please enter a valid PNR Number.");
            return;
        }

        // UX: Show searching state
        const btn = document.querySelector('#cancel-section .input-group button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;

            // Mock Data or State Data
            const data = {
                train: "12951 - Rajdhani Express",
                date: "14 Feb, 2026",
                pnr: input,
                passengers: [
                    { name: "Rahul Sharma", age: 28, seat: "CNF/B1/45" },
                    { name: "Guest User", age: 30, seat: "CNF/B1/46" }
                ]
            };

            // Enhance with Real State if available and relevant
            if (state.booking.train && state.booking.seats && state.booking.seats.length > 0) {
                data.train = state.booking.train;
                data.date = state.booking.date || "14 Feb, 2026";
                data.pnr = input;
                data.passengers = state.booking.seats.map((s, i) => ({
                    name: i === 0 ? (document.getElementById('p-name')?.value || "User") : `Passenger ${i + 1}`,
                    age: 28, // Dummy
                    seat: `CNF/B1/${s}`
                }));
            }

            // Render Details
            document.getElementById('c-train-name').textContent = data.train;
            document.getElementById('c-date').textContent = data.date;
            document.getElementById('c-pnr-display').textContent = data.pnr;

            const list = document.getElementById('c-passenger-list');
            list.innerHTML = '';

            data.passengers.forEach((p, idx) => {
                const html = `
                <label style="display:flex; justify-content:space-between; padding:15px; background:white; border:1px solid #eee; border-radius:8px; align-items:center; cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <input type="checkbox" class="cancel-check" checked onchange="window.updateRefundCalc()" style="width:18px; height:18px; cursor:pointer;">
                        <div>
                            <div style="font-weight:700; font-size:1rem; color:#333;">${p.name}</div>
                            <div style="font-size:0.85rem; color:#666; margin-top:2px;">Age: ${p.age} • Seat: <span style="color:var(--success-green); font-weight:700;">${p.seat}</span></div>
                        </div>
                    </div>
                    <div style="color:var(--success-green); font-size:0.8rem; font-weight:700; background:#E8F5E9; padding:4px 8px; border-radius:4px;">CONFIRMED</div>
                </label>`;
                list.innerHTML += html;
            });

            document.getElementById('cancel-details').classList.remove('hidden');
            document.getElementById('cancel-success').classList.add('hidden');

            // Initial Calc
            window.updateRefundCalc();

        }, 1500); // Simulate network delay
    };

    window.updateRefundCalc = function () {
        const checkedCount = document.querySelectorAll('.cancel-check:checked').length;
        // Logic: Ticket Price (1250) - Cancellation Charge (120 for AC)
        const refundPerTicket = 1250 - 120;
        const totalRefund = checkedCount * refundPerTicket;

        document.getElementById('c-refund-amount').textContent = totalRefund > 0 ? totalRefund.toLocaleString() : 0;

        const btn = document.querySelector('#cancel-details button.btn-primary');
        if (checkedCount === 0) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    };

    window.confirmCancellation = function () {
        const amount = document.getElementById('c-refund-amount').textContent;
        const checkedCount = document.querySelectorAll('.cancel-check:checked').length;

        if (checkedCount === 0) return;

        if (!confirm(`Are you sure you want to cancel ${checkedCount} passenger(s)? Refund of ₹${amount} will be initiated.`)) {
            return;
        }

        // Show Success
        document.getElementById('cancel-details').classList.add('hidden');
        document.getElementById('cancel-success').classList.remove('hidden');

        document.getElementById('final-refund').textContent = amount;

        // Random Ref ID
        const refId = "IRCTC" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
        document.getElementById('ref-id').textContent = refId;
    };

});