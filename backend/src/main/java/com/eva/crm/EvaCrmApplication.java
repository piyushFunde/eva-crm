package com.eva.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import com.eva.crm.repository.CustomerRepository;
import com.eva.crm.repository.CollectionLogRepository;
import com.eva.crm.entity.Customer;
import com.eva.crm.entity.CollectionLog;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@SpringBootApplication
@EnableCaching
@org.springframework.scheduling.annotation.EnableScheduling
public class EvaCrmApplication {

    @jakarta.annotation.PostConstruct
    public void init() {
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
    }

    @Bean
    public CommandLineRunner repairDatabase(
            CustomerRepository customerRepository,
            CollectionLogRepository collectionLogRepository) {
        return args -> {
            try {
                List<Customer> zeroEmiCustomers = customerRepository.findAll().stream()
                        .filter(c -> c.getEmiAmount() == null || c.getEmiAmount().compareTo(BigDecimal.ZERO) == 0)
                        .collect(Collectors.toList());

                if (!zeroEmiCustomers.isEmpty()) {
                    System.out.println("Found " + zeroEmiCustomers.size() + " customers with emiAmount = 0. Restoring original EMI amounts...");
                    for (Customer customer : zeroEmiCustomers) {
                        List<CollectionLog> logs = collectionLogRepository.findByCustomerIdOrderByCollectedAtDesc(customer.getId());
                        if (!logs.isEmpty()) {
                            // Oldest log is the last element when ordered by collectedAt desc
                            CollectionLog oldestLog = logs.get(logs.size() - 1);
                            BigDecimal originalEmi = oldestLog.getPreviousPendingAmount();
                            if (originalEmi != null && originalEmi.compareTo(BigDecimal.ZERO) > 0) {
                                customer.setEmiAmount(originalEmi);
                                if ("COMPLETED".equalsIgnoreCase(customer.getStatus())) {
                                    customer.setPendingAmount(BigDecimal.ZERO);
                                } else {
                                    // Set pendingAmount to the remaining amount of the latest log
                                    CollectionLog latestLog = logs.get(0);
                                    customer.setPendingAmount(latestLog.getRemainingAmount());
                                }
                                customerRepository.save(customer);
                                System.out.println("Repaired customer ID " + customer.getId() + " (" + customer.getName() + "): restored emiAmount to " + originalEmi + ", pendingAmount to " + customer.getPendingAmount());
                            } else {
                                System.out.println("Could not repair customer ID " + customer.getId() + " (" + customer.getName() + ") because oldest log's previousPendingAmount is invalid: " + originalEmi);
                            }
                        } else {
                            System.out.println("Could not repair customer ID " + customer.getId() + " (" + customer.getName() + ") because no collection logs exist.");
                        }
                    }
                } else {
                    System.out.println("No customers found with emiAmount = 0. Database is clean.");
                }
            } catch (Exception e) {
                System.err.println("Error during database repair startup runner: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(EvaCrmApplication.class, args);
    }

    private static void loadDotEnv() {
        java.io.File envFile = new java.io.File(".env");
        if (!envFile.exists()) {
            envFile = new java.io.File("backend/.env");
        }
        if (envFile.exists()) {
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int eqIdx = line.indexOf('=');
                    if (eqIdx > 0) {
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                        } else if (value.startsWith("'") && value.endsWith("'")) {
                            value = value.substring(1, value.length() - 1);
                        }
                        if (System.getenv(key) == null && System.getProperty(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to load .env file: " + e.getMessage());
            }
        }
    }

}
