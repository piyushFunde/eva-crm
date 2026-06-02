package com.eva.crm.repository;

import com.eva.crm.entity.CollectionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CollectionLogRepository extends JpaRepository<CollectionLog, Long> {
    List<CollectionLog> findByExecutiveIdOrderByCollectedAtDesc(Long executiveId);
    Page<CollectionLog> findByExecutiveIdOrderByCollectedAtDesc(Long executiveId, Pageable pageable);
    
    List<CollectionLog> findByCustomerIdOrderByCollectedAtDesc(Long customerId);
    
    Page<CollectionLog> findAllByOrderByCollectedAtDesc(Pageable pageable);

    @Query("SELECT c FROM CollectionLog c WHERE " +
           "LOWER(c.customer.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "c.customer.phone LIKE CONCAT('%', :search, '%') " +
           "ORDER BY c.collectedAt DESC")
    Page<CollectionLog> searchAllCollections(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM CollectionLog c WHERE c.executive.id = :executiveId AND (" +
           "LOWER(c.customer.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "c.customer.phone LIKE CONCAT('%', :search, '%')) " +
           "ORDER BY c.collectedAt DESC")
    Page<CollectionLog> searchExecutiveCollections(@Param("executiveId") Long executiveId, @Param("search") String search, Pageable pageable);

    @Query("SELECT SUM(c.amountCollected) FROM CollectionLog c WHERE c.collectedAt >= :startOfDay")
    BigDecimal sumAmountCollectedToday(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT SUM(c.amountCollected) FROM CollectionLog c WHERE c.executive.id = :executiveId AND c.collectedAt >= :startOfDay")
    BigDecimal sumAmountCollectedTodayByExecutive(@Param("executiveId") Long executiveId, @Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT COUNT(c) FROM CollectionLog c WHERE c.executive.id = :executiveId AND c.collectedAt >= :startOfDay")
    long countCollectedTodayByExecutive(@Param("executiveId") Long executiveId, @Param("startOfDay") LocalDateTime startOfDay);

    boolean existsByClientGeneratedId(String clientGeneratedId);

    @Query("SELECT SUM(c.amountCollected) FROM CollectionLog c WHERE c.collectedAt BETWEEN :start AND :end")
    BigDecimal sumAmountCollectedInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(value = "SELECT DATE(collected_at) as trendDate, SUM(amount_collected) as amount " +
           "FROM collection_logs " +
           "WHERE collected_at BETWEEN :start AND :end " +
           "GROUP BY DATE(collected_at) " +
           "ORDER BY trendDate ASC", nativeQuery = true)
    List<com.eva.crm.dto.TrendData> getCollectionTrend(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT c.paymentMode, COUNT(c) FROM CollectionLog c GROUP BY c.paymentMode")
    List<Object[]> getPaymentModeDistribution();

    @Query("SELECT DISTINCT c.customer.id FROM CollectionLog c WHERE c.collectedAt >= :startOfDay")
    List<Long> findCustomerIdsWithCollectionsToday(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT DISTINCT c.customer.id FROM CollectionLog c WHERE c.executive.id = :executiveId AND c.collectedAt >= :startOfDay")
    List<Long> findCustomerIdsWithCollectionsTodayByExecutive(@Param("executiveId") Long executiveId, @Param("startOfDay") LocalDateTime startOfDay);
}
