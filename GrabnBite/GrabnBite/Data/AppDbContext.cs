using GrabnBite.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrabnBite.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Tables
        public DbSet<User> Users { get; set; }
        public DbSet<EmailVerificationChallenge> EmailVerificationChallenges { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<MenuCategory> MenuCategories { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

        public DbSet<Payment> Payments { get; set; }
        public DbSet<PaymentReconciliationEvent> PaymentReconciliationEvents { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<DriverApplication> DriverApplications { get; set; }
        public DbSet<DriverApplicationDocument> DriverApplicationDocuments { get; set; }
        public DbSet<DriverApplicationHistory> DriverApplicationHistories { get; set; }
        public DbSet<PolicyDocument> PolicyDocuments { get; set; }

        // Restaurant partner onboarding
        public DbSet<RestaurantApplication> RestaurantApplications { get; set; }
        public DbSet<RestaurantDocument> RestaurantDocuments { get; set; }
        public DbSet<RestaurantBankingDetail> RestaurantBankingDetails { get; set; }
        public DbSet<RestaurantAgreementAcceptance> RestaurantAgreementAcceptances { get; set; }
        public DbSet<RestaurantAgreementAcceptanceDocument> RestaurantAgreementAcceptanceDocuments { get; set; }
        public DbSet<RestaurantOperatingHour> RestaurantOperatingHours { get; set; }
        public DbSet<RestaurantApplicationHistory> RestaurantApplicationHistories { get; set; }
        public DbSet<RestaurantApplicationReviewItem> RestaurantApplicationReviewItems { get; set; }
        public DbSet<RestaurantCommissionSetting> RestaurantCommissionSettings { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {


            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PolicyDocument>()
    .HasIndex(p => new { p.IsArchived, p.Status });

            // ============================================================
            // USER → ADDRESS
            // One User can have many Addresses
            // ============================================================



            modelBuilder.Entity<Address>()
                .HasOne(a => a.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ============================================================
            // ROLE → USER
            // One Role can have many Users
            // ============================================================

            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // USER → ORDER
            // One User can have many Orders
            // ============================================================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // USER → REVIEW
            // ============================================================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // USER → NOTIFICATION
            // One User can have many Notifications
            // ============================================================

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            // ============================================================
            // USER → DRIVER
            // One User can have zero or one Driver
            // ============================================================

            modelBuilder.Entity<Driver>()
                .HasOne(d => d.User)
                .WithOne(u => u.Driver)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Driver>()
                .HasIndex(d => d.UserId)
                .IsUnique();


            // ============================================================
            // USER → RESTAURANT
            // One User can own many Restaurants
            // ============================================================

            modelBuilder.Entity<Restaurant>()
                .HasOne(r => r.User)
                .WithMany(u => u.Restaurants)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);



            // ============================================================
            // DRIVER PARTNER APPLICATIONS
            // ============================================================

            modelBuilder.Entity<DriverApplication>()
                .HasOne(a => a.User)
                .WithOne(u => u.DriverApplication)
                .HasForeignKey<DriverApplication>(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DriverApplication>()
                .HasOne(a => a.ReviewedByUser)
                .WithMany()
                .HasForeignKey(a => a.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DriverApplication>()
                .HasIndex(a => a.UserId)
                .IsUnique();

            modelBuilder.Entity<DriverApplication>()
                .HasIndex(a => a.ApplicationReference)
                .IsUnique();

            modelBuilder.Entity<DriverApplication>()
                .HasIndex(a => new { a.Status, a.UpdatedAt });

            modelBuilder.Entity<DriverApplication>()
                .Property(a => a.ApplicationReference)
                .HasMaxLength(30)
                .IsRequired();

            modelBuilder.Entity<DriverApplication>()
                .Property(a => a.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<DriverApplicationDocument>()
                .HasOne(d => d.DriverApplication)
                .WithMany(a => a.Documents)
                .HasForeignKey(d => d.DriverApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DriverApplicationDocument>()
                .HasOne(d => d.VerifiedByUser)
                .WithMany()
                .HasForeignKey(d => d.VerifiedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DriverApplicationDocument>()
                .HasIndex(d => new { d.DriverApplicationId, d.DocumentType });

            modelBuilder.Entity<DriverApplicationDocument>()
                .Property(d => d.VerificationStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<DriverApplicationHistory>()
                .HasOne(h => h.DriverApplication)
                .WithMany(a => a.History)
                .HasForeignKey(h => h.DriverApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DriverApplicationHistory>()
                .HasOne(h => h.PerformedByUser)
                .WithMany()
                .HasForeignKey(h => h.PerformedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DriverApplicationHistory>()
                .HasIndex(h => new { h.DriverApplicationId, h.CreatedAt });

            modelBuilder.Entity<DriverApplicationHistory>()
                .Property(h => h.PreviousStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<DriverApplicationHistory>()
                .Property(h => h.NewStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            // ============================================================
            // RESTAURANT PARTNER APPLICATIONS
            // ============================================================

            modelBuilder.Entity<RestaurantApplication>()
                .HasOne(a => a.User)
                .WithMany(u => u.RestaurantApplications)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RestaurantApplication>()
                .HasOne(a => a.ReviewedByUser)
                .WithMany()
                .HasForeignKey(a => a.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<RestaurantApplication>()
                .HasIndex(a => a.ApplicationReference)
                .IsUnique();

            modelBuilder.Entity<RestaurantApplication>()
                .HasIndex(a => new { a.UserId, a.Status });

            modelBuilder.Entity<RestaurantApplication>()
                .HasIndex(a => a.CreatedAt);

            modelBuilder.Entity<RestaurantApplication>()
                .Property(a => a.ApplicationReference)
                .HasMaxLength(30)
                .IsRequired();

            modelBuilder.Entity<RestaurantApplication>()
                .Property(a => a.TradingName)
                .HasMaxLength(200);

            modelBuilder.Entity<RestaurantApplication>()
                .Property(a => a.RegisteredBusinessName)
                .HasMaxLength(200);

            modelBuilder.Entity<RestaurantApplication>()
                .Property(a => a.CipcRegistrationNumber)
                .HasMaxLength(100);

            modelBuilder.Entity<RestaurantApplication>()
                .Property(a => a.MaximumDeliveryDistanceKm)
                .HasPrecision(8, 2);

            // One approved application creates at most one operational restaurant.
            // The nullable FK preserves compatibility with legacy restaurants.
            modelBuilder.Entity<Restaurant>()
                .HasOne(r => r.RestaurantApplication)
                .WithOne(a => a.Restaurant)
                .HasForeignKey<Restaurant>(r => r.RestaurantApplicationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Restaurant>()
                .HasIndex(r => r.RestaurantApplicationId)
                .IsUnique()
                .HasFilter("\"RestaurantApplicationId\" IS NOT NULL");

            modelBuilder.Entity<Restaurant>()
                .Property(r => r.IsActive)
                .HasDefaultValue(true);

            // Application documents; previous uploads remain as separate records.
            modelBuilder.Entity<RestaurantDocument>()
                .HasOne(d => d.RestaurantApplication)
                .WithMany(a => a.Documents)
                .HasForeignKey(d => d.RestaurantApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RestaurantDocument>()
                .HasOne(d => d.VerifiedByUser)
                .WithMany()
                .HasForeignKey(d => d.VerifiedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<RestaurantDocument>()
                .HasIndex(d => d.RestaurantApplicationId);

            modelBuilder.Entity<RestaurantDocument>()
                .Property(d => d.OriginalFileName)
                .HasMaxLength(255)
                .IsRequired();

            modelBuilder.Entity<RestaurantDocument>()
                .Property(d => d.ContentType)
                .HasMaxLength(150)
                .IsRequired();

            // One current banking-details record per application.
            modelBuilder.Entity<RestaurantBankingDetail>()
                .HasOne(b => b.RestaurantApplication)
                .WithOne(a => a.BankingDetails)
                .HasForeignKey<RestaurantBankingDetail>(b => b.RestaurantApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RestaurantBankingDetail>()
                .HasIndex(b => b.RestaurantApplicationId)
                .IsUnique();

            modelBuilder.Entity<RestaurantBankingDetail>()
                .HasOne(b => b.VerifiedByUser)
                .WithMany()
                .HasForeignKey(b => b.VerifiedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Agreement acceptance and immutable accepted-document snapshots.
            modelBuilder.Entity<RestaurantAgreementAcceptanceDocument>()
    .HasKey(d => d.AgreementAcceptanceDocumentId);

            modelBuilder.Entity<RestaurantAgreementAcceptance>()
                .HasOne(a => a.RestaurantApplication)
                .WithMany(r => r.AgreementAcceptances)
                .HasForeignKey(a => a.RestaurantApplicationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RestaurantAgreementAcceptanceDocument>()
                .HasOne(d => d.RestaurantAgreementAcceptance)
                .WithMany(a => a.Documents)
                .HasForeignKey(d => d.RestaurantAgreementAcceptanceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RestaurantAgreementAcceptanceDocument>()
                .HasOne(d => d.PolicyDocument)
                .WithMany()
                .HasForeignKey(d => d.PolicyDocumentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RestaurantAgreementAcceptanceDocument>()
                .HasIndex(d => d.RestaurantAgreementAcceptanceId);

            modelBuilder.Entity<RestaurantAgreementAcceptanceDocument>()
                .Property(d => d.ContentHash)
                .HasMaxLength(128)
                .IsRequired();

            // One operating-hours row per weekday and application.
            modelBuilder.Entity<RestaurantOperatingHour>()
                .HasOne(h => h.RestaurantApplication)
                .WithMany(a => a.OperatingHours)
                .HasForeignKey(h => h.RestaurantApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RestaurantOperatingHour>()
                .HasIndex(h => new { h.RestaurantApplicationId, h.DayOfWeek })
                .IsUnique();

            // Application audit history.
            modelBuilder.Entity<RestaurantApplicationHistory>()
                .HasOne(h => h.RestaurantApplication)
                .WithMany(a => a.History)
                .HasForeignKey(h => h.RestaurantApplicationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RestaurantApplicationHistory>()
                .HasOne(h => h.PerformedByUser)
                .WithMany()
                .HasForeignKey(h => h.PerformedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<RestaurantApplicationHistory>()
                .HasIndex(h => new { h.RestaurantApplicationId, h.CreatedAt });

            // One checklist item per review category and application.
            modelBuilder.Entity<RestaurantApplicationReviewItem>()
                .HasOne(i => i.RestaurantApplication)
                .WithMany(a => a.ReviewItems)
                .HasForeignKey(i => i.RestaurantApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RestaurantApplicationReviewItem>()
                .HasOne(i => i.ReviewedByUser)
                .WithMany()
                .HasForeignKey(i => i.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<RestaurantApplicationReviewItem>()
                .HasIndex(i => new { i.RestaurantApplicationId, i.ReviewCategory })
                .IsUnique();

            // Each restaurant has its own commission schedule.
            modelBuilder.Entity<RestaurantCommissionSetting>()
                .HasOne(c => c.Restaurant)
                .WithOne(r => r.CommissionSettings)
                .HasForeignKey<RestaurantCommissionSetting>(c => c.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RestaurantCommissionSetting>()
                .HasIndex(c => c.RestaurantId)
                .IsUnique();

            modelBuilder.Entity<RestaurantCommissionSetting>()
                .Property(c => c.PromotionCommissionRate)
                .HasPrecision(5, 4);

            modelBuilder.Entity<RestaurantCommissionSetting>()
                .Property(c => c.CollectionCommissionRate)
                .HasPrecision(5, 4);

            modelBuilder.Entity<RestaurantCommissionSetting>()
                .Property(c => c.RestaurantDeliveryCommissionRate)
                .HasPrecision(5, 4);

            modelBuilder.Entity<RestaurantCommissionSetting>()
                .Property(c => c.GrubnBiteDeliveryCommissionRate)
                .HasPrecision(5, 4);

            modelBuilder.Entity<RestaurantCommissionSetting>()
                .ToTable(t =>
                {
                    t.HasCheckConstraint(
                        "CK_RestaurantCommissionSettings_Rates",
                        "\"PromotionCommissionRate\" BETWEEN 0 AND 1 AND " +
                        "\"CollectionCommissionRate\" BETWEEN 0 AND 1 AND " +
                        "\"RestaurantDeliveryCommissionRate\" BETWEEN 0 AND 1 AND " +
                        "\"GrubnBiteDeliveryCommissionRate\" BETWEEN 0 AND 1");

                    t.HasCheckConstraint(
                        "CK_RestaurantCommissionSettings_PromotionDates",
                        "\"PromotionEndDateExclusive\" > \"PromotionStartDate\"");
                });

            // Store enums as readable values instead of numeric ordinals.
            modelBuilder.Entity<RestaurantApplication>()
                .Property(a => a.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<RestaurantDocument>()
                .Property(d => d.DocumentType)
                .HasConversion<string>()
                .HasMaxLength(40);

            modelBuilder.Entity<RestaurantDocument>()
                .Property(d => d.VerificationStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<RestaurantBankingDetail>()
                .Property(b => b.VerificationStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<RestaurantApplicationHistory>()
                .Property(h => h.PreviousStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<RestaurantApplicationHistory>()
                .Property(h => h.NewStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<RestaurantApplicationReviewItem>()
                .Property(i => i.ReviewCategory)
                .HasConversion<string>()
                .HasMaxLength(40);

            modelBuilder.Entity<RestaurantApplicationReviewItem>()
                .Property(i => i.VerificationStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<RestaurantOperatingHour>()
                .Property(h => h.DayOfWeek)
                .HasConversion<string>()
                .HasMaxLength(15);

            // ============================================================
            // RESTAURANT → MENU CATEGORY
            // One Restaurant can have many Categories
            // ============================================================

            modelBuilder.Entity<MenuCategory>()
                .HasOne(mc => mc.Restaurant)
                .WithMany(r => r.MenuCategories)
                .HasForeignKey(mc => mc.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);


            // ============================================================
            // RESTAURANT → MENU ITEM
            // One Restaurant can have many MenuItems
            // ============================================================

            modelBuilder.Entity<MenuItem>()
                .HasOne(mi => mi.Restaurant)
                .WithMany(r => r.MenuItems)
                .HasForeignKey(mi => mi.RestaurantId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // MENU CATEGORY → MENU ITEM
            // One Category can have many MenuItems
            // ============================================================

            modelBuilder.Entity<MenuItem>()
                .HasOne(mi => mi.MenuCategory)
                .WithMany(mc => mc.MenuItems)
                .HasForeignKey(mi => mi.MenuCategoryId)
                .OnDelete(DeleteBehavior.Cascade);


            // ============================================================
            // RESTAURANT → ORDER
            // One Restaurant can have many Orders
            // ============================================================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Restaurant)
                .WithMany(r => r.Orders)
                .HasForeignKey(o => o.RestaurantId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // ADDRESS → ORDER
            // One Address can be used by many Orders
            // ============================================================

            modelBuilder.Entity<Order>()
                .HasOne(o => o.DeliveryAddress)
                .WithMany(a => a.Orders)
                .HasForeignKey(o => o.DeliveryAddressId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // ORDER → ORDER ITEM
            // One Order has many OrderItems
            // ============================================================

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);


            // ============================================================
            // MENU ITEM → ORDER ITEM
            // One MenuItem can appear in many OrderItems
            // ============================================================

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.MenuItem)
                .WithMany(mi => mi.OrderItems)
                .HasForeignKey(oi => oi.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // ORDER → PAYMENT
            // One Order has zero or one Payment
            // ============================================================

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Order)
                .WithOne(o => o.Payment)
                .HasForeignKey<Payment>(p => p.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.OrderId)
                .IsUnique();


            // ============================================================
            // ORDER → DELIVERY
            // One Order has zero or one Delivery
            // ============================================================

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Order)
                .WithOne(o => o.Delivery)
                .HasForeignKey<Delivery>(d => d.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Delivery>()
                .HasIndex(d => d.OrderId)
                .IsUnique();


            // ============================================================
            // DRIVER → DELIVERY
            // One Driver can have many Deliveries
            // Driver is optional
            // ============================================================

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.Driver)
                .WithMany(dr => dr.Deliveries)
                .HasForeignKey(d => d.DriverId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // RESTAURANT → REVIEW
            // One Restaurant can have many Reviews
            // ============================================================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Restaurant)
                .WithMany(rest => rest.Reviews)
                .HasForeignKey(r => r.RestaurantId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // ORDER → REVIEW
            // One Order has zero or one Review
            // ============================================================

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Order)
                .WithOne(o => o.Review)
                .HasForeignKey<Review>(r => r.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasIndex(r => r.OrderId)
                .IsUnique();


            // ============================================================
            // CART → USER
            // One User can have many Carts
            // ============================================================

            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany(u => u.Carts)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            // ============================================================
            // CART → RESTAURANT
            // One Restaurant can have many Carts
            // ============================================================

            modelBuilder.Entity<Cart>()
                .HasOne(c => c.Restaurant)
                .WithMany(r => r.Carts)
                .HasForeignKey(c => c.RestaurantId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // USER + RESTAURANT → CART
            // One active cart per User/Restaurant combination
            // ============================================================

            modelBuilder.Entity<Cart>()
                .HasIndex(c => new
                {
                    c.UserId,
                    c.RestaurantId
                })
                .IsUnique();


            // ============================================================
            // CART → CART ITEM
            // ============================================================

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.CartItems)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);


            // ============================================================
            // MENU ITEM → CART ITEM
            // ============================================================

            // Preserve the existing CartId index alongside the composite uniqueness index.
            modelBuilder.Entity<CartItem>()
                .HasIndex(ci => ci.CartId);

            modelBuilder.Entity<CartItem>()
                .HasIndex(ci => new { ci.CartId, ci.MenuItemId })
                .IsUnique();

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.MenuItem)
                .WithMany()
                .HasForeignKey(ci => ci.MenuItemId)
                .OnDelete(DeleteBehavior.Restrict);


            // ============================================================
            // DECIMAL PRECISION
            // ============================================================

            modelBuilder.Entity<MenuItem>()
                .Property(mi => mi.Price)
                .HasPrecision(10, 2);

            modelBuilder.Entity<CartItem>()
                .Property(ci => ci.UnitPrice)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.Subtotal)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Payment>()
                .Property(p => p.RefundAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Payment>()
                .Property(p => p.RefundStatus)
                .HasDefaultValue("NOT_REQUIRED");

            modelBuilder.Entity<Payment>()
                .Property(p => p.RequiresReconciliation)
                .HasDefaultValue(false);

            modelBuilder.Entity<Payment>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Payments_RefundStatus",
                    "\"RefundStatus\" IN ('NOT_REQUIRED', 'REQUIRED', 'PENDING', 'SUCCEEDED', 'FAILED', 'MANUAL_REVIEW')"));

            modelBuilder.Entity<PaymentReconciliationEvent>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_PaymentReconciliationEvents_RefundStatus",
                    "\"RefundStatus\" IN ('NOT_REQUIRED', 'REQUIRED', 'PENDING', 'SUCCEEDED', 'FAILED', 'MANUAL_REVIEW')"));

            modelBuilder.Entity<PaymentReconciliationEvent>()
                .HasOne(e => e.Payment)
                .WithMany(p => p.ReconciliationEvents)
                .HasForeignKey(e => e.PaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PaymentReconciliationEvent>()
                .HasIndex(e => new { e.PaymentId, e.CreatedAt });

            // Provider webhook retries must not create duplicate reconciliation cases.
            // Limit uniqueness to system-generated Yoco event types so the admin audit
            // trail can still record repeated status transitions using the same reference.
            modelBuilder.Entity<PaymentReconciliationEvent>()
                .HasIndex(e => new { e.PaymentId, e.EventType, e.ProviderReference })
                .IsUnique()
                .HasFilter("\"ProviderReference\" IS NOT NULL AND \"EventType\" IN ('YOCO_MULTIPLE_CHECKOUTS_COMPLETED', 'YOCO_STALE_CHECKOUT_COMPLETED', 'YOCO_CHECKOUT_CREATED_AFTER_STATE_CHANGED')")
                .HasDatabaseName("IX_PaymentReconciliationEvents_YocoEventIdempotency");

            // Preserve the existing actor lookup index used by the audit trail.
            modelBuilder.Entity<PaymentReconciliationEvent>()
                .HasIndex(e => e.ActorUserId);


            // ============================================================
            // USER EMAIL
            // ============================================================

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .Property(u => u.IsEmailVerified)
                .HasDefaultValue(true);

            modelBuilder.Entity<EmailVerificationChallenge>()
                .HasOne(c => c.User)
                .WithOne(u => u.EmailVerificationChallenge)
                .HasForeignKey<EmailVerificationChallenge>(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EmailVerificationChallenge>()
                .HasIndex(c => c.UserId)
                .IsUnique();

            modelBuilder.Entity<EmailVerificationChallenge>()
                .Property(c => c.CodeHash)
                .HasMaxLength(128)
                .IsRequired();


            // ============================================================
            // REVIEW RATING
            // ============================================================

            modelBuilder.Entity<Review>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Reviews_Rating",
                    "\"Rating\" >= 1 AND \"Rating\" <= 5"
                ));


            // ============================================================
            // ORDER STATUS HISTORY
            // ============================================================

            modelBuilder.Entity<OrderStatusHistory>()
                .HasIndex(h => h.ChangedByUserId);

            modelBuilder.Entity<OrderStatusHistory>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(h => h.ChangedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<OrderStatusHistory>()
                .HasOne(h => h.Order)
                .WithMany(o => o.StatusHistory)
                .HasForeignKey(h => h.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}