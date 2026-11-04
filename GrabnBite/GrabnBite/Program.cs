using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using GrabnBite.Data;
using GrabnBite.Hubs;
using GrabnBite.Configuration;
using GrabnBite.Services;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://0.0.0.0:10000");
}

builder.Services.Configure<YocoSettings>(builder.Configuration.GetSection("Yoco"));
builder.Services.AddHttpClient<YocoPaymentService>();

builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddHttpClient<ICloudinaryImageService, CloudinaryImageService>();

builder.Services.Configure<SupabaseStorageSettings>(
    builder.Configuration.GetSection("SupabaseStorage"));
builder.Services.AddHttpClient<ISupabasePolicyStorageService, SupabasePolicyStorageService>();

builder.Services.Configure<SupabaseRestaurantDocumentStorageSettings>(
    builder.Configuration.GetSection("SupabaseRestaurantDocumentStorage"));
builder.Services.AddHttpClient<ISupabaseRestaurantDocumentStorageService, SupabaseRestaurantDocumentStorageService>();
builder.Services.AddSingleton<IRestaurantBankingEncryptionService, RestaurantBankingEncryptionService>();

builder.Services.AddScoped<FakePaymentGateway>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("MyPolicy", builder =>
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GrabnBite API",
        Version = "v1",
        Description = "GrabnBite Web API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        // Production schema changes are applied through controlled EF migrations.
        await db.Database.OpenConnectionAsync();
        app.Logger.LogInformation("Database connectivity check succeeded.");
        await db.Database.CloseConnectionAsync();

        if (app.Environment.IsDevelopment())
        {
            await DbSeeder.SeedAsync(db);
            app.Logger.LogInformation("Development database seeding completed.");
        }
        else
        {
            app.Logger.LogInformation(
                "Database seeding skipped because the application is not running in Development.");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogCritical(
            ex,
            "Application startup stopped because the database connection or development seeding failed.");
        throw;
    }
}

app.UseCors("MyPolicy");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<TrackingHub>("/hubs/tracking");

app.Run();
